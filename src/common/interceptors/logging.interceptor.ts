import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, originalUrl, body } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = this.getIpAddress(request);

    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // 요청 로깅 (body 포함)
    this.logger.log(
      `[${requestId}] Request: ${method} ${originalUrl} - IP: ${ip} - UA: ${userAgent}`,
    );

    // body가 있는 경우에만 로깅
    if (Object.keys(body).length > 0) {
      this.logger.log(
        `[${requestId}] Request Body: ${this.sanitizeBody(body)}`,
      );
    }

    return next.handle().pipe(
      tap((data) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const statusCode = response.statusCode;

        // 응답 로깅 (body 포함)
        this.logger.log(
          `[${requestId}] Response: ${statusCode} - ${method} ${originalUrl} - ${duration}ms`,
        );

        // 응답 데이터가 있는 경우에만 로깅
        if (data) {
          this.logger.log(
            `[${requestId}] Response Body: ${this.sanitizeBody(data)}`,
          );
        }
      }),
    );
  }

  // 중요 정보를 숨기기 위한 로그 정제 함수
  private sanitizeBody(body: any): string {
    if (!body) return '';

    try {
      // 깊은 복사를 통해 원본 객체 수정 방지
      const sanitized = JSON.parse(JSON.stringify(body));

      // 민감한 필드 마스킹 처리
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];

      const maskSensitiveData = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;

        Object.keys(obj).forEach((key) => {
          if (
            sensitiveFields.some((field) => key.toLowerCase().includes(field))
          ) {
            obj[key] = '*****';
          } else if (typeof obj[key] === 'object') {
            maskSensitiveData(obj[key]);
          }
        });
      };

      maskSensitiveData(sanitized);

      // 로그 출력을 위한 JSON 문자열 변환
      const stringified = JSON.stringify(sanitized);

      // 너무 긴 경우 줄여서 표시
      if (stringified.length > 1000) {
        return `${stringified.substring(0, 997)}...`;
      }

      return stringified;
    } catch (error) {
      return `[Cannot stringify body: ${error.message}]`;
    }
  }

  // 요청 ID 생성
  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  // IP 주소 가져오기
  private getIpAddress(request: Request): string {
    return (
      request.headers['x-forwarded-for'] ||
      request.ip ||
      request.connection.remoteAddress ||
      'unknown'
    ).toString();
  }
}
