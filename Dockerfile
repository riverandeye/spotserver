FROM node:22-alpine AS builder

WORKDIR /app

# 종속성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 프로덕션 이미지
FROM node:22-alpine

WORKDIR /app

# 프로덕션 패키지만 설치
COPY package*.json ./
RUN npm install --omit=dev

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env ./.env
COPY --from=builder /app/firebase-service-account.json ./firebase-service-account.json

# 포트 노출
EXPOSE 3000

# 환경 변수 설정
ENV NODE_ENV=production

# 애플리케이션 실행
CMD ["node", "dist/main"] 