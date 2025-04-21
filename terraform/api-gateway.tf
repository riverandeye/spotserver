resource "aws_api_gateway_rest_api" "spotserver" {
  name        = "${var.app_name}-api"
  description = "Spot Server API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "${var.app_name}-api"
    Environment = var.app_environment
  }
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  parent_id   = aws_api_gateway_rest_api.spotserver.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.spotserver.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.proxy" = true
  }
}

resource "aws_api_gateway_integration" "alb" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy.http_method

  type                    = "HTTP_PROXY"
  integration_http_method = "ANY"
  uri = var.domain_name != "" && var.create_certificate ? "https://${aws_lb.spotserver.dns_name}/{proxy}" : "http://${aws_lb.spotserver.dns_name}/{proxy}"
  connection_type         = "INTERNET"

  request_parameters = {
    "integration.request.path.proxy" = "method.request.path.proxy"
  }
}

# 루트 경로 처리
resource "aws_api_gateway_method" "root" {
  rest_api_id   = aws_api_gateway_rest_api.spotserver.id
  resource_id   = aws_api_gateway_rest_api.spotserver.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "root" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  resource_id = aws_api_gateway_rest_api.spotserver.root_resource_id
  http_method = aws_api_gateway_method.root.http_method

  type                    = "HTTP_PROXY"
  integration_http_method = "ANY"
  # 커스텀 도메인과 HTTPS가 활성화된 경우 HTTPS 앤드포인트로 연결
  uri = var.domain_name != "" && var.create_certificate ? "https://${aws_lb.spotserver.dns_name}/" : "http://${aws_lb.spotserver.dns_name}/"
  connection_type         = "INTERNET"
}

resource "aws_api_gateway_deployment" "spotserver" {
  depends_on = [
    aws_api_gateway_integration.alb,
    aws_api_gateway_integration.root
  ]

  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  stage_name  = ""

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "spotserver" {
  deployment_id = aws_api_gateway_deployment.spotserver.id
  rest_api_id   = aws_api_gateway_rest_api.spotserver.id
  stage_name    = var.app_environment

  tags = {
    Name        = "${var.app_name}-stage"
    Environment = var.app_environment
  }
}

# API Gateway 커스텀 도메인 이름 (HTTPS 적용)
resource "aws_api_gateway_domain_name" "api" {
  count = var.domain_name != "" && var.create_certificate ? 1 : 0
  
  domain_name              = "api.${var.domain_name}"
  regional_certificate_arn = aws_acm_certificate_validation.cert_manual[0].certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "${var.app_name}-domain"
    Environment = var.app_environment
  }
}

# API Gateway와 Stage 매핑
resource "aws_api_gateway_base_path_mapping" "api" {
  count = var.domain_name != "" && var.create_certificate ? 1 : 0
  
  api_id      = aws_api_gateway_rest_api.spotserver.id
  stage_name  = aws_api_gateway_stage.spotserver.stage_name
  domain_name = aws_api_gateway_domain_name.api[0].domain_name
}

# DNS 설정을 위한 출력 (Route53을 사용하지 않는 경우)
output "api_gateway_domain_target" {
  description = "API Gateway 도메인 타겟 (DNS CNAME 설정에 필요)"
  value       = var.domain_name != "" && var.create_certificate ? {
    name  = "api.${var.domain_name}"
    value = aws_api_gateway_domain_name.api[0].regional_domain_name
  } : null
} 