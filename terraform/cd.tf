# ECR 이미지 변경 시 자동 배포를 위한 CodePipeline 및 관련 리소스 구성

# CloudWatch 이벤트 규칙: ECR 이미지 푸시 감지
resource "aws_cloudwatch_event_rule" "ecr_image_push" {
  name        = "${var.app_name}-ecr-image-push"
  description = "Capture ECR image push events for ${var.app_name}"

  event_pattern = jsonencode({
    source      = ["aws.ecr"],
    detail-type = ["ECR Image Action"],
    detail = {
      action-type = ["PUSH"],
      repository-name = [var.ecr_repository_name],
      image-tag = ["latest", var.docker_image_tag]
    }
  })

  tags = {
    Name        = "${var.app_name}-ecr-image-push-rule"
    Environment = var.app_environment
  }
}

# CodeBuild 서비스 역할
resource "aws_iam_role" "codebuild_role" {
  name = "${var.app_name}-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "codebuild.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-codebuild-role"
    Environment = var.app_environment
  }
}

# CodeBuild 정책
resource "aws_iam_policy" "codebuild_policy" {
  name        = "${var.app_name}-codebuild-policy"
  description = "Policy for CodeBuild to update ECS service"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:DescribeImages"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:RegisterTaskDefinition",
          "ecs:UpdateService"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "iam:PassRole"
        ],
        Resource = [
          aws_iam_role.ecs_execution_role.arn,
          aws_iam_role.ecs_task_role.arn
        ]
      }
    ]
  })
}

# CodeBuild 역할에 정책 연결
resource "aws_iam_role_policy_attachment" "codebuild_policy_attachment" {
  role       = aws_iam_role.codebuild_role.name
  policy_arn = aws_iam_policy.codebuild_policy.arn
}

# CloudWatch 로그 그룹 (CodeBuild 로그용)
resource "aws_cloudwatch_log_group" "codebuild_logs" {
  name              = "/aws/codebuild/${var.app_name}-deploy"
  retention_in_days = 30

  tags = {
    Name        = "${var.app_name}-codebuild-logs"
    Environment = var.app_environment
  }
}

# CodeBuild 프로젝트
resource "aws_codebuild_project" "deploy_ecs" {
  name          = "${var.app_name}-deploy"
  description   = "Deploy the latest image to ECS service for ${var.app_name}"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = 10

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    type                        = "LINUX_CONTAINER"
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:3.0"
    privileged_mode             = false
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "ECS_CLUSTER"
      value = aws_ecs_cluster.main.name
    }

    environment_variable {
      name  = "ECS_SERVICE"
      value = aws_ecs_service.spotserver.name
    }

    environment_variable {
      name  = "TASK_DEFINITION"
      value = aws_ecs_task_definition.spotserver.family
    }

    environment_variable {
      name  = "CONTAINER_NAME"
      value = var.app_name
    }

    environment_variable {
      name  = "ECR_REPOSITORY_URI"
      value = aws_ecr_repository.spotserver.repository_url
    }

    environment_variable {
      name  = "ECR_REPOSITORY_NAME"
      value = var.ecr_repository_name
    }
  }

  source {
    type      = "NO_SOURCE"
    buildspec = jsonencode({
      version = "0.2"
      phases = {
        pre_build = {
          commands = [
            "echo Starting deployment to ECS",
            "aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI"
          ]
        }
        build = {
          commands = [
            "echo Getting latest image tag",
            "LATEST_TAG=$(aws ecr describe-images --repository-name $ECR_REPOSITORY_NAME --query 'sort_by(imageDetails,& imagePushedAt)[-1].imageTags[0]' --output text)",
            "echo Latest image tag: $LATEST_TAG",
            "echo Updating ECS service with the latest image",
            "TASK_DEFINITION_FAMILY=$TASK_DEFINITION",
            "echo Using task definition family: $TASK_DEFINITION_FAMILY",
            "aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment"
          ]
        }
        post_build = {
          commands = [
            "echo Deployment completed successfully",
            "echo Latest image: $ECR_REPOSITORY_URI:$LATEST_TAG is now being deployed"
          ]
        }
      }
    })
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild_logs.name
      stream_name = "${var.app_name}-deploy-log"
    }
  }

  tags = {
    Name        = "${var.app_name}-deploy-project"
    Environment = var.app_environment
  }
}

# CloudWatch 이벤트 대상: ECR 푸시 이벤트를 CodeBuild 프로젝트로 연결
resource "aws_cloudwatch_event_target" "codebuild_target" {
  rule      = aws_cloudwatch_event_rule.ecr_image_push.name
  target_id = "${var.app_name}-deploy-target"
  arn       = aws_codebuild_project.deploy_ecs.arn
  role_arn  = aws_iam_role.events_role.arn
}

# CloudWatch 이벤트 서비스 역할
resource "aws_iam_role" "events_role" {
  name = "${var.app_name}-events-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "events.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-events-role"
    Environment = var.app_environment
  }
}

# CloudWatch 이벤트 서비스 정책
resource "aws_iam_policy" "events_policy" {
  name        = "${var.app_name}-events-policy"
  description = "Policy for CloudWatch Events to trigger CodeBuild"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "codebuild:StartBuild"
        ],
        Resource = aws_codebuild_project.deploy_ecs.arn
      }
    ]
  })
}

# CloudWatch 이벤트 역할에 정책 연결
resource "aws_iam_role_policy_attachment" "events_policy_attachment" {
  role       = aws_iam_role.events_role.name
  policy_arn = aws_iam_policy.events_policy.arn
} 