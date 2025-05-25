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
      this.logger.error('AWS credentials are not configured.');
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
      this.logger.error('S3 bucket name is not configured.');
    }
    this.bucketName = bucketName || '';
  }

  /**
   * Upload a file to the S3 bucket.
   * @param file File object to upload
   * @param path File path (folder) in S3
   * @returns URL of the uploaded file
   */
  async uploadFile(file: Express.Multer.File, path: string): Promise<string> {
    try {
      if (!file) {
        throw new Error('File does not exist.');
      }

      if (!this.bucketName) {
        throw new Error('S3 bucket name is not configured.');
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

      // Return S3 file URL format
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`, error.stack);
      throw new Error(`Error occurred while uploading file: ${error.message}`);
    }
  }
}
