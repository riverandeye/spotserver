resource "aws_acm_certificate" "cert" {
  count = var.domain_name != "" && var.create_certificate ? 1 : 0

  domain_name               = var.domain_name
  subject_alternative_names = concat(["api.${var.domain_name}"], var.alternative_domain_names)
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.app_name}-certificate"
    Environment = var.app_environment
  }
}

# DNS 검증 레코드 추가를 위한 참고 출력 (Route53을 사용하지 않는 경우)
output "certificate_validation_records" {
  description = "도메인 검증을 위해 추가해야 하는 DNS 레코드 (수동 추가 필요)"
  value       = var.domain_name != "" && var.create_certificate ? {
    for dvo in aws_acm_certificate.cert[0].domain_validation_options :
      dvo.domain_name => {
        name   = dvo.resource_record_name
        type   = dvo.resource_record_type
        value  = dvo.resource_record_value
      }
  } : {}
}

# 인증서 검증 대기
resource "aws_acm_certificate_validation" "cert_manual" {
  count = var.domain_name != "" && var.create_certificate ? 1 : 0

  certificate_arn         = aws_acm_certificate.cert[0].arn
  # validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
  
  # DNS 검증을 수동으로 수행할 경우 아래 주석 해제
  timeouts {
    create = "60m"
  }
} 