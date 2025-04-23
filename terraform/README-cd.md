# ECR-ECS 자동 배포 파이프라인

이 문서는 ECR에 새 이미지가 푸시될 때 ECS 서비스를 자동으로 업데이트하는 CD(Continuous Deployment) 파이프라인에 대해 설명합니다.

## 아키텍처 개요

```
ECR Push Event → CloudWatch Events Rule → CodeBuild Project → ECS Service Update
```

1. 개발자가 ECR에 새 이미지를 푸시합니다.
2. CloudWatch Events 규칙이 ECR 푸시 이벤트를 감지합니다.
3. 이벤트가 CodeBuild 프로젝트를 트리거합니다.
4. CodeBuild는 최신 이미지로 새 ECS 태스크 정의를 생성합니다.
5. CodeBuild는 새 태스크 정의로 ECS 서비스를 업데이트합니다.

## 설정된 리소스

### CloudWatch Events Rule (aws_cloudwatch_event_rule.ecr_image_push)

ECR 이미지 푸시 이벤트를 캡처합니다. 특히 지정된 ECR 리포지토리에 새 이미지가 푸시될 때 트리거됩니다.

### CodeBuild Project (aws_codebuild_project.deploy_ecs)

ECR 이미지 푸시 이벤트가 감지되면 실행되는 CodeBuild 프로젝트입니다. 이 프로젝트는 다음 작업을 수행합니다:

- 최신 푸시된 이미지 태그 확인
- 현재 ECS 태스크 정의 다운로드
- 새 이미지 URI로 태스크 정의 업데이트
- 업데이트된 태스크 정의 등록
- 새 태스크 정의로 ECS 서비스 업데이트

### IAM 역할 및 정책

각 서비스에 필요한 권한을 부여하기 위한 IAM 역할과 정책:

- `aws_iam_role.codebuild_role`: CodeBuild가 필요한 작업을 수행할 수 있는 권한
- `aws_iam_role.events_role`: CloudWatch Events가 CodeBuild를 트리거할 수 있는 권한

## 주요 특징

- **자동화된 배포**: 개발자가 ECR에 이미지를 푸시하면 추가 작업 없이 자동으로 배포됩니다.
- **최신 이미지 사용**: 항상 ECR에 푸시된 가장 최신 이미지를 사용합니다.
- **투명한 로깅**: CloudWatch Logs를 통해 배포 프로세스의 전체 로그를 확인할 수 있습니다.
- **무중단 배포**: ECS의 롤링 업데이트를 통해 다운타임 없이 배포됩니다.

## 사용 방법

1. 코드 변경 후 로컬에서 이미지 빌드:

   ```bash
   docker build -t ${ECR_REPOSITORY_URI}:latest .
   ```

2. AWS ECR에 이미지 푸시:

   ```bash
   aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_REPOSITORY_URI}
   docker push ${ECR_REPOSITORY_URI}:latest
   ```

3. 푸시 후 자동으로 배포가 시작됩니다. 배포 상태는 AWS CodeBuild 콘솔에서 확인할 수 있습니다.

## 문제 해결

배포에 문제가 있는 경우 다음 리소스를 확인하세요:

1. **CloudWatch Logs**: `/aws/codebuild/${APP_NAME}-deploy`에서 CodeBuild 로그 확인
2. **CodeBuild 프로젝트**: AWS 콘솔에서 CodeBuild 프로젝트 빌드 이력 확인
3. **ECS 서비스 이벤트**: AWS 콘솔에서 ECS 서비스 이벤트 및 배포 상태 확인
