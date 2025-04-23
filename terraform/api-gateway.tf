resource "aws_api_gateway_rest_api" "spotserver" {
  name        = "${var.app_name}-api"
  description = "Spot Server API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  # Enable CloudWatch logging
  binary_media_types = ["*/*"]

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
  authorization = "NONE" # Consider using "AWS_IAM" or "COGNITO_USER_POOLS" for production

  request_parameters = {
    "method.request.path.proxy" = true
    "method.request.header.X-Forwarded-For"   = false
    "method.request.header.X-Forwarded-Port"  = false
    "method.request.header.X-Forwarded-Proto" = false
    "method.request.header.Host"              = false
  }
}

# Add OPTIONS method for CORS
resource "aws_api_gateway_method" "proxy_options" {
  rest_api_id   = aws_api_gateway_rest_api.spotserver.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "proxy_options" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "proxy_options" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "proxy_options" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_options.http_method
  status_code = aws_api_gateway_method_response.proxy_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE,PATCH'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_integration" "alb" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy.http_method

  type                    = "HTTP_PROXY"
  integration_http_method = "ANY"
  
  # Fix the URI format for ALB integration with proper proxy handling - always use HTTP
  uri                     = "http://${aws_lb.spotserver.dns_name}/{proxy}"
  connection_type         = "INTERNET"
  timeout_milliseconds    = 29000 # Nearly 30 seconds max for API Gateway
  tls_config {
    insecure_skip_verification = true
  }
  
  cache_key_parameters = ["method.request.path.proxy"]
  
  request_parameters = {
    "integration.request.path.proxy" = "method.request.path.proxy"
  }
}

resource "aws_api_gateway_integration_response" "alb" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
  
  depends_on = [
    aws_api_gateway_integration.alb,
    aws_api_gateway_method_response.proxy_success
  ]
}

resource "aws_api_gateway_method_response" "proxy_success" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# Root path handling
resource "aws_api_gateway_method" "root" {
  rest_api_id   = aws_api_gateway_rest_api.spotserver.id
  resource_id   = aws_api_gateway_rest_api.spotserver.root_resource_id
  http_method   = "ANY"
  authorization = "NONE" # Consider using "AWS_IAM" or "COGNITO_USER_POOLS" for production
  
  request_parameters = {
    "method.request.header.X-Forwarded-For"   = false
    "method.request.header.X-Forwarded-Port"  = false
    "method.request.header.X-Forwarded-Proto" = false
    "method.request.header.Host"              = false
  }
}

# Add OPTIONS method for CORS on root path
resource "aws_api_gateway_method" "root_options" {
  rest_api_id   = aws_api_gateway_rest_api.spotserver.id
  resource_id   = aws_api_gateway_rest_api.spotserver.root_resource_id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "root_options" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  resource_id = aws_api_gateway_rest_api.spotserver.root_resource_id
  http_method = aws_api_gateway_method.root_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "root_options" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  resource_id = aws_api_gateway_rest_api.spotserver.root_resource_id
  http_method = aws_api_gateway_method.root_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "root_options" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  resource_id = aws_api_gateway_rest_api.spotserver.root_resource_id
  http_method = aws_api_gateway_method.root_options.http_method
  status_code = aws_api_gateway_method_response.root_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE,PATCH'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_integration" "root" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  resource_id = aws_api_gateway_rest_api.spotserver.root_resource_id
  http_method = aws_api_gateway_method.root.http_method

  type                    = "HTTP_PROXY"
  integration_http_method = "ANY"
  uri                     = "http://${aws_lb.spotserver.dns_name}"
  connection_type         = "INTERNET"
  timeout_milliseconds    = 29000
  tls_config {
    insecure_skip_verification = true
  }
}

resource "aws_api_gateway_integration_response" "root" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  resource_id = aws_api_gateway_rest_api.spotserver.root_resource_id
  http_method = aws_api_gateway_method.root.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
  
  depends_on = [
    aws_api_gateway_integration.root,
    aws_api_gateway_method_response.root_success
  ]
}

resource "aws_api_gateway_method_response" "root_success" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  resource_id = aws_api_gateway_rest_api.spotserver.root_resource_id
  http_method = aws_api_gateway_method.root.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# Enable CloudWatch logging for API Gateway
resource "aws_api_gateway_account" "this" {
  cloudwatch_role_arn = aws_iam_role.apigw_cloudwatch.arn
}

resource "aws_iam_role" "apigw_cloudwatch" {
  name = "${var.app_name}-apigw-cloudwatch-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "apigw_cloudwatch" {
  name = "${var.app_name}-apigw-cloudwatch-policy"
  role = aws_iam_role.apigw_cloudwatch.id

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:PutLogEvents",
                "logs:GetLogEvents",
                "logs:FilterLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
EOF
}

# Method settings for logging and throttling
resource "aws_api_gateway_method_settings" "settings" {
  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  stage_name  = aws_api_gateway_stage.spotserver.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled      = true
    logging_level        = "INFO"
    data_trace_enabled   = true
    throttling_rate_limit  = 1000
    throttling_burst_limit = 500
    caching_enabled        = false
  }
}

resource "aws_api_gateway_deployment" "spotserver" {
  depends_on = [
    aws_api_gateway_integration.alb,
    aws_api_gateway_integration.root,
    aws_api_gateway_integration.proxy_options,
    aws_api_gateway_integration.root_options
  ]

  rest_api_id = aws_api_gateway_rest_api.spotserver.id
  
  # Don't specify stage_name here to use the separate stage resource
  stage_name  = ""

  lifecycle {
    create_before_destroy = true
  }

  # Add a trigger to force redeployment when configuration changes
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.proxy.id,
      aws_api_gateway_method.proxy.id,
      aws_api_gateway_method.root.id,
      aws_api_gateway_integration.alb.id,
      aws_api_gateway_integration.root.id,
      aws_api_gateway_method.proxy_options.id,
      aws_api_gateway_method.root_options.id,
      # Add a timestamp to force redeployment
      timestamp()
    ]))
  }
}

resource "aws_api_gateway_stage" "spotserver" {
  deployment_id = aws_api_gateway_deployment.spotserver.id
  rest_api_id   = aws_api_gateway_rest_api.spotserver.id
  stage_name    = var.app_environment
  
  xray_tracing_enabled = true
  
  # Enable access logs
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn
    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
      }
    )
  }

  tags = {
    Name        = "${var.app_name}-stage"
    Environment = var.app_environment
  }
}

# Create CloudWatch log group for API Gateway access logs
resource "aws_cloudwatch_log_group" "api_gw" {
  name = "/aws/apigateway/${var.app_name}-${var.app_environment}"
  retention_in_days = 30
  
  tags = {
    Name        = "${var.app_name}-apigw-logs"
    Environment = var.app_environment
  }
}

# Create WAF WebACL for the API Gateway
resource "aws_wafv2_web_acl" "api_waf" {
  count = var.enable_waf ? 1 : 0
  
  name        = "${var.app_name}-${var.app_environment}-api-waf"
  description = "WAF for API Gateway protection"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.app_name}-common-rule"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitRule"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 3000 # Adjust as needed
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.app_name}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.app_name}-web-acl"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "${var.app_name}-api-waf"
    Environment = var.app_environment
  }
}

# Associate the WAF WebACL with the API Gateway Stage
resource "aws_wafv2_web_acl_association" "api_waf_association" {
  count = var.enable_waf ? 1 : 0
  
  resource_arn = aws_api_gateway_stage.spotserver.arn
  web_acl_arn  = aws_wafv2_web_acl.api_waf[0].arn
}

# API Gateway Custom Domain Name (HTTPS)
resource "aws_api_gateway_domain_name" "api" {
  count = var.domain_name != "" && var.create_certificate ? 1 : 0
  
  domain_name              = "api.${var.domain_name}"
  regional_certificate_arn = aws_acm_certificate_validation.cert_manual[0].certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  security_policy = "TLS_1_2"

  tags = {
    Name        = "${var.app_name}-domain"
    Environment = var.app_environment
  }
}

# API Gateway Base Path Mapping with Stage
resource "aws_api_gateway_base_path_mapping" "api" {
  count = var.domain_name != "" && var.create_certificate ? 1 : 0
  
  api_id      = aws_api_gateway_rest_api.spotserver.id
  stage_name  = aws_api_gateway_stage.spotserver.stage_name
  domain_name = aws_api_gateway_domain_name.api[0].domain_name
}

# Variables for WAF
variable "enable_waf" {
  description = "Whether to enable WAF for API Gateway"
  type        = bool
  default     = false
}

# DNS output for Route53 (if not using Route53)
output "api_gateway_domain_target" {
  description = "API Gateway domain target (needed for DNS CNAME configuration)"
  value       = var.domain_name != "" && var.create_certificate ? {
    name  = "api.${var.domain_name}"
    value = aws_api_gateway_domain_name.api[0].regional_domain_name
  } : null
}

output "api_gateway_invoke_url" {
  description = "URL to invoke the API Gateway"
  value       = "${aws_api_gateway_deployment.spotserver.invoke_url}${aws_api_gateway_stage.spotserver.stage_name}"
} 