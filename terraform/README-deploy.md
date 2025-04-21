# api.teamspot.biz 배포 가이드

이 문서는 Porkbun DNS 제공업체에서 구매한 `teamspot.biz` 도메인을 사용하여 API를 `api.teamspot.biz`로 배포하는 과정을 설명합니다.

## 사전 준비

1. AWS CLI가 설치되어 있고, 적절한 권한을 가진 AWS 계정으로 구성되어 있어야 합니다.
2. Terraform이 설치되어 있어야 합니다.
3. Docker가 설치되어 있어야 합니다.
4. Porkbun 계정에 `teamspot.biz` 도메인이 등록되어 있어야 합니다.

## 배포 단계

### 1. 테라폼 초기화 및 적용

```bash
cd terraform
terraform init
terraform apply
```

Terraform apply 과정에서 변수 값을 확인하고 `yes`를 입력하여 계속 진행합니다.

### 2. SSL 인증서 검증을 위한 DNS 레코드 추가

테라폼 배포 후 출력되는 `certificate_validation_records` 정보를 확인합니다. 다음과 비슷한 형식으로 출력됩니다:

```
certificate_validation_records = {
  "teamspot.biz" = {
    "name" = "_a79865eb4cd1bb1a63c88d9191f86771.teamspot.biz."
    "type" = "CNAME"
    "value" = "_c958f83dddd08c41930cdf35fe5a6955.hkvuiqjoua.acm-validations.aws."
  }
}
```

Porkbun 관리 패널에서 다음과 같이 DNS 레코드를 추가합니다:

1. Porkbun 로그인 후 도메인 관리 페이지로 이동
2. DNS Records 섹션으로 이동
3. "Add a Record" 클릭
4. 다음 정보로 레코드 추가:
   - Type: `CNAME`
   - Host: 출력된 `name` 값에서 도메인 부분을 제외한 앞부분 (예: `_a79865eb4cd1bb1a63c88d9191f86771`)
   - Answer: 출력된 `value` 값 (예: `_c958f83dddd08c41930cdf35fe5a6955.hkvuiqjoua.acm-validations.aws.`)
5. TTL: 자동 (기본값)
6. 저장

### 3. API Gateway 도메인 연결을 위한 DNS 레코드 추가

테라폼 출력의 `api_gateway_domain_target` 정보를 사용하여 Porkbun에 API 서브도메인 레코드를 추가합니다:

```
api_gateway_domain_target = {
  "name" = "api.teamspot.biz"
  "value" = "d-abcdefghij.execute-api.ap-northeast-2.amazonaws.com"
}
```

Porkbun 관리 패널에서:

1. "Add a Record" 클릭
2. 다음 정보로 레코드 추가:
   - Type: `CNAME`
   - Host: `api`
   - Answer: 출력된 `value` 값 (예: `d-abcdefghij.execute-api.ap-northeast-2.amazonaws.com`)
3. TTL: 자동 (기본값)
4. 저장

### 4. DNS 전파 및 인증서 검증 대기

DNS 레코드가 전파되고 AWS ACM이 인증서를 검증하는 데 최대 30분이 소요될 수 있습니다. 다음 명령어로 인증서 상태를 확인할 수 있습니다:

```bash
aws acm list-certificates --query "CertificateSummaryList[?DomainName=='teamspot.biz']"
```

인증서 ARN을 얻은 후 상세 상태를 확인:

```bash
aws acm describe-certificate --certificate-arn 인증서_ARN
```

### 5. 도커 이미지 빌드 및 ECR 푸시

테라폼 출력에서 `ecr_repository_url` 값을 확인한 후:

```bash
# 애플리케이션 루트 디렉토리에서 실행
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 계정ID.dkr.ecr.ap-northeast-2.amazonaws.com
docker build -t 계정ID.dkr.ecr.ap-northeast-2.amazonaws.com/spotserver:latest .
docker push 계정ID.dkr.ecr.ap-northeast-2.amazonaws.com/spotserver:latest
```

### 6. 배포 확인

모든 과정이 완료되면 `https://api.teamspot.biz` 주소로 API에 접근할 수 있습니다.

## 문제 해결

1. **DNS 레코드가 올바르게 설정되었는지 확인**:

   ```bash
   dig CNAME api.teamspot.biz
   ```

2. **인증서 검증 상태 확인**:

   ```bash
   aws acm describe-certificate --certificate-arn 인증서_ARN --query "Certificate.Status"
   ```

3. **API Gateway 연결 확인**:

   ```bash
   aws apigateway get-domain-name --domain-name api.teamspot.biz
   ```

4. **ECS 서비스 상태 확인**:
   ```bash
   aws ecs describe-services --cluster spotserver-cluster --services spotserver-service --region ap-northeast-2
   ```

## 관련 리소스 삭제

프로젝트를 삭제하려면:

```bash
terraform destroy
```

Porkbun에서 추가한 DNS 레코드도 함께 삭제하는 것을 잊지 마세요.
