#!/bin/bash
set -e

# 변수 설정
REGION="ap-northeast-2"
ACCOUNT_ID="396913704046"
REPOSITORY_NAME="spotserver"
IMAGE_TAG="latest"
REPOSITORY_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPOSITORY_NAME}"

echo "===== AWS ECR 로그인 ====="
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${REPOSITORY_URI}

echo "===== Docker 이미지 빌드 (amd64 플랫폼) ====="
docker build --platform=linux/amd64 -t ${REPOSITORY_URI}:${IMAGE_TAG} .

echo "===== Docker 이미지 푸시 ====="
docker push ${REPOSITORY_URI}:${IMAGE_TAG}

echo "===== 배포 완료 ====="
echo "이미지가 성공적으로 빌드되어 ECR에 푸시되었습니다."
echo "AWS ECS 서비스가 자동으로 새 이미지를 배포할 것입니다."
echo "API 엔드포인트: https://api.teamspot.biz" 