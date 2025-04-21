# Route53 호스팅 영역 사용 시 활성화하기 위한 변수
variable "use_route53" {
  description = "Route53 자동 구성 사용 여부"
  type        = bool
  default     = false
}

variable "hosted_zone_id" {
  description = "Route53 호스팅 영역 ID (use_route53 활성화 시 필요)"
  type        = string
  default     = ""
}

# Route53 레코드 생성 (호스팅 영역이 이미 존재한다고 가정)
resource "aws_route53_record" "api" {
  count = var.use_route53 && var.domain_name != "" && var.create_certificate ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_api_gateway_domain_name.api[0].regional_domain_name
    zone_id                = aws_api_gateway_domain_name.api[0].regional_zone_id
    evaluate_target_health = true
  }
}

# SSL 인증서 검증을 위한 DNS 레코드
resource "aws_route53_record" "cert_validation" {
  count = var.use_route53 && var.domain_name != "" && var.create_certificate ? length(aws_acm_certificate.cert[0].domain_validation_options) : 0

  zone_id = var.hosted_zone_id
  name    = element(aws_acm_certificate.cert[0].domain_validation_options.*.resource_record_name, count.index)
  type    = element(aws_acm_certificate.cert[0].domain_validation_options.*.resource_record_type, count.index)
  records = [element(aws_acm_certificate.cert[0].domain_validation_options.*.resource_record_value, count.index)]
  ttl     = 60
}

# Route53 자동 구성 사용 시 인증서 검증 방식 변경
locals {
  certificate_validation_enabled = var.use_route53 && var.domain_name != "" && var.create_certificate
}

# Route53 사용 시 인증서 검증
resource "aws_acm_certificate_validation" "cert_route53" {
  count = local.certificate_validation_enabled ? 1 : 0

  certificate_arn         = aws_acm_certificate.cert[0].arn
  validation_record_fqdns = aws_route53_record.cert_validation.*.fqdn
}

# ALB에 대한 Route53 레코드
resource "aws_route53_record" "alb" {
  count = var.use_route53 && var.domain_name != "" && var.create_certificate ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.spotserver.dns_name
    zone_id                = aws_lb.spotserver.zone_id
    evaluate_target_health = true
  }
} 