resource "aws_api_gateway_stage" "spotserver" {
  deployment_id = aws_api_gateway_deployment.spotserver.id
  rest_api_id   = aws_api_gateway_rest_api.spotserver.id
  stage_name    = var.app_environment

  # CloudWatch 로그 설정 추가
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format          = jsonencode({
      requestId            = "$context.requestId"
      ip                   = "$context.identity.sourceIp"
      caller               = "$context.identity.caller"
      user                 = "$context.identity.user"
      requestTime          = "$context.requestTime"
      httpMethod           = "$context.httpMethod"
      resourcePath         = "$context.resourcePath"
      status               = "$context.status"
      protocol             = "$context.protocol"
      responseLength       = "$context.responseLength"
      integrationStatus    = "$context.integration.status"
      integrationLatency   = "$context.integration.latency"
      integrationRequestId = "$context.integration.requestId"
      errorMessage         = "$context.error.message"
    })
  }

  tags = {
    Name        = "${var.app_name}-stage"
    Environment = var.app_environment
  }
}

# API Gateway 로깅을 위한 CloudWatch 로그 그룹
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${aws_api_gateway_rest_api.spotserver.name}"
  retention_in_days = 7

  tags = {
    Name        = "${var.app_name}-api-logs"
    Environment = var.app_environment
  }
}

# API Gateway와 Stage 매핑
resource "aws_api_gateway_base_path_mapping" "api" {
  count = var.domain_name != "" && var.create_certificate ? 1 : 0
  
  api_id      = aws_api_gateway_rest_api.spotserver.id
  stage_name  = ""  # 빈 문자열로 설정
  domain_name = aws_api_gateway_domain_name.api[0].domain_name
} 