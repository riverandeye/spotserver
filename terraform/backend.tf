terraform {
  backend "s3" {
    bucket  = "spot-shared-bucket-apne2"
    key     = "terraform/terraform.tfstate"
    region  = "ap-northeast-2"
    encrypt = true
    dynamodb_table = "spot-terraform-locks-apne2"
  }
} 