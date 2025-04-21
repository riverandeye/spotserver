output "ecr_repository_url" {
  description = "ECR 리포지토리 URL"
  value       = aws_ecr_repository.spotserver.repository_url
}

output "alb_dns_name" {
  description = "애플리케이션 로드 밸런서 DNS 이름"
  value       = aws_lb.spotserver.dns_name
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = "${aws_api_gateway_deployment.spotserver.invoke_url}/${aws_api_gateway_stage.spotserver.stage_name}"
}

output "https_enabled" {
  description = "HTTPS가 활성화되었는지 여부"
  value       = var.domain_name != "" && var.create_certificate
}

output "custom_domain" {
  description = "설정된 커스텀 도메인"
  value       = var.domain_name != "" ? {
    domain      = var.domain_name
    api_domain  = var.domain_name != "" ? "api.${var.domain_name}" : null
    api_url     = var.domain_name != "" ? "https://api.${var.domain_name}" : null
  } : null
}

output "deployment_instructions" {
  description = "배포 방법 안내"
  value       = <<EOT
ECR 이미지 푸시 명령어:
aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.spotserver.repository_url}
docker build -t ${aws_ecr_repository.spotserver.repository_url}:${var.docker_image_tag} .
docker push ${aws_ecr_repository.spotserver.repository_url}:${var.docker_image_tag}

API 엔드포인트:
${var.domain_name != "" && var.create_certificate ? "https://api.${var.domain_name}" : "${aws_api_gateway_deployment.spotserver.invoke_url}/${aws_api_gateway_stage.spotserver.stage_name}"}
EOT
} 