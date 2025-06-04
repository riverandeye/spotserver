# 스팟 서버

## 시작하기

```shell
npm install -g pnpm # install pnpm
pnpm install        # install dependencies
pnpm start:dev      # Start with hot reload
```

## 실행 준비

- AWS Credential 을 현재 terminal session 에 세팅할 것

## 배포하기

```shell
scripts/deploy.sh
```

## 테라폼 업그레이드

```shell
cd terraform
terraform apply -auto-approve
terraform validate

```
