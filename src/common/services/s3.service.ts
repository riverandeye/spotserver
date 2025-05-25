import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    this.region = this.configService.get<string>(
      'AWS_REGION',
      'ap-northeast-2',
    );

    if (!accessKeyId || !secretAccessKey) {
      this.logger.error('AWS 자격 증명이 설정되지 않았습니다.');
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
            }
          : undefined,
    });

    const bucketName =
      this.configService.get<string>('S3_BUCKET_NAME') ||
      this.configService.get<string>('AWS_S3_BUCKET_NAME');
    if (!bucketName) {
      this.logger.error('S3 버킷 이름이 설정되지 않았습니다.');
    }
    this.bucketName = bucketName || '';
  }

  /**
   * S3 버킷에 파일을 업로드합니다.
   * @param file 업로드할 파일 객체
   * @param path S3 내 파일 경로 (폴더)
   * @returns 업로드된 파일의 URL
   */
  async uploadFile(file: Express.Multer.File, path: string): Promise<string> {
    try {
      if (!file) {
        throw new Error('파일이 존재하지 않습니다.');
      }

      if (!this.bucketName) {
        throw new Error('S3 버킷 이름이 설정되지 않았습니다.');
      }

      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${path}/${randomUUID()}.${fileExtension}`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read' as ObjectCannedACL,
      };

      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      // S3 파일 URL 형식 반환
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
    } catch (error) {
      this.logger.error(`파일 업로드 실패: ${error.message}`, error.stack);
      throw new Error(`파일 업로드 중 오류가 발생했습니다: ${error.message}`);
    }
  }
}
