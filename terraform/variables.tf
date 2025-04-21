variable "aws_region" {
  description = "AWS 리전"
  type        = string
  default     = "ap-northeast-2"
}

variable "app_name" {
  description = "애플리케이션 이름"
  type        = string
  default     = "spotserver"
}

variable "app_environment" {
  description = "애플리케이션 환경"
  type        = string
  default     = "production"
}

variable "container_port" {
  description = "컨테이너 포트"
  type        = number
  default     = 3000
}

variable "vpc_cidr" {
  description = "VPC CIDR 블록"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "퍼블릭 서브넷 CIDR 블록"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "프라이빗 서브넷 CIDR 블록"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "ecr_repository_name" {
  description = "ECR 리포지토리 이름"
  type        = string
  default     = "spotserver"
}

variable "docker_image_tag" {
  description = "도커 이미지 태그"
  type        = string
  default     = "latest"
}

variable "fargate_cpu" {
  description = "Fargate CPU 유닛"
  type        = number
  default     = 256
}

variable "fargate_memory" {
  description = "Fargate 메모리(MB)"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "ECS 태스크 개수"
  type        = number
  default     = 2
}

variable "health_check_path" {
  description = "헬스 체크 경로"
  type        = string
  default     = "/health"
}

variable "domain_name" {
  description = "애플리케이션 도메인 이름"
  type        = string
  default     = ""
}

variable "create_certificate" {
  description = "SSL 인증서 생성 여부"
  type        = bool
  default     = true
}

variable "alternative_domain_names" {
  description = "대체 도메인 이름 (예: www.도메인.com)"
  type        = list(string)
  default     = []
} 