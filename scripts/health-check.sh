#!/bin/bash

API_ENDPOINT="https://api.teamspot.biz/health"

echo "===== API 상태 확인 ====="
echo "엔드포인트: ${API_ENDPOINT}"

response=$(curl -s -o /dev/null -w "%{http_code}" ${API_ENDPOINT})

if [ $response -eq 200 ]; then
  echo "✅ API가 정상적으로 동작 중입니다 (상태 코드: ${response})"
  exit 0
else
  echo "❌ API 응답 오류: 상태 코드 ${response}"
  exit 1
fi 