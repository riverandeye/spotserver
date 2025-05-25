# S3 버킷 설정 파일
# 이 파일은 TeamSpot 애플리케이션에서 사용할 S3 버킷을 정의합니다.

# 랜덤 문자열 생성 (보안 강화)
resource "random_id" "bucket_suffix" {
  byte_length = 8
}

resource "aws_s3_bucket" "spot_storage" {
  bucket = "${var.app_name}-storage-${var.app_environment}-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.app_name}-storage-${var.app_environment}"
    Environment = var.app_environment
  }
}

# 버킷 객체 소유권 설정 (ACL 활성화)
resource "aws_s3_bucket_ownership_controls" "spot_storage_ownership" {
  bucket = aws_s3_bucket.spot_storage.id
  
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# 버킷 ACL 설정
resource "aws_s3_bucket_acl" "spot_storage_acl" {
  depends_on = [aws_s3_bucket_ownership_controls.spot_storage_ownership]
  
  bucket = aws_s3_bucket.spot_storage.id
  acl    = "private"
}

# 버킷 퍼블릭 액세스 차단 설정
resource "aws_s3_bucket_public_access_block" "spot_storage_public_access" {
  bucket = aws_s3_bucket.spot_storage.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# 버킷 정책 설정 (퍼블릭 읽기 허용)
resource "aws_s3_bucket_policy" "public_read_access" {
  bucket = aws_s3_bucket.spot_storage.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource = [
          "${aws_s3_bucket.spot_storage.arn}/*",
        ]
      },
    ]
  })
  
  depends_on = [aws_s3_bucket_public_access_block.spot_storage_public_access]
}

# 버킷 암호화 설정
resource "aws_s3_bucket_server_side_encryption_configuration" "spot_storage_encryption" {
  bucket = aws_s3_bucket.spot_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 버킷 버전 관리 설정
resource "aws_s3_bucket_versioning" "spot_storage_versioning" {
  bucket = aws_s3_bucket.spot_storage.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# 버킷에 대한 CORS 설정
resource "aws_s3_bucket_cors_configuration" "spot_storage_cors" {
  bucket = aws_s3_bucket.spot_storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]  # 모든 오리진 허용
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# 출력값 정의
output "s3_bucket_name" {
  description = "The name of the S3 bucket"
  value       = aws_s3_bucket.spot_storage.bucket
}

output "s3_bucket_arn" {
  description = "The ARN of the S3 bucket"
  value       = aws_s3_bucket.spot_storage.arn
} 