# Spotserver 테라폼 인프라 구성

이 디렉토리에는 AWS에 Spotserver 애플리케이션을 배포하기 위한 테라폼 코드가 포함되어 있습니다.

## 아키텍처

- **API Gateway**: HTTP 요청을 처리하고 ALB로 라우팅
- **Application Load Balancer (ALB)**: 트래픽을 ECS Fargate 서비스로 분산
- **ECS Fargate**: 애플리케이션 컨테이너 실행
- **ECR**: 도커 이미지 저장소

## 사전 요구 사항

- AWS CLI가 설치되어 있고, 적절한 권한을 가진 AWS 계정으로 구성되어 있어야 합니다.
- Terraform이 설치되어 있어야 합니다. (버전 1.2.0 이상)
- Docker가 설치되어 있어야 합니다.

## 배포 방법

### 1. 테라폼 초기화

```bash
cd terraform
terraform init
```

### 2. 테라폼 계획

```bash
terraform plan
```

### 3. 테라폼 적용

```bash
terraform apply
```

### 4. 도커 이미지 빌드 및 푸시

```bash
# 애플리케이션 루트 디렉토리에서
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <ECR_REPO_URL>
docker build -t <ECR_REPO_URL>:latest .
docker push <ECR_REPO_URL>:latest
```

## 리소스 삭제

```bash
terraform destroy
```

## 환경 변수 구성

`variables.tf` 파일에서 다음과 같은 변수들을 수정할 수 있습니다:

- `aws_region`: AWS 리전
- `app_name`: 애플리케이션 이름
- `app_environment`: 배포 환경 (production, staging, etc.)
- `container_port`: 애플리케이션 컨테이너 포트
- `fargate_cpu`: Fargate CPU 유닛
- `fargate_memory`: Fargate 메모리 (MB)
- `desired_count`: ECS 태스크 수

## 상태 관리

테라폼 상태를 원격으로 관리하려면 `backend.tf` 파일의 주석을 제거하고 S3 버킷 및 DynamoDB 테이블 정보를 업데이트하세요.
