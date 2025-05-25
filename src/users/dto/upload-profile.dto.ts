import { ApiProperty } from '@nestjs/swagger';

export class UploadProfileResponseDto {
  @ApiProperty({
    description: '프로필 이미지 업로드 성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example:
      'https://bucket-name.s3.ap-northeast-2.amazonaws.com/users/user123/profile/abcd1234.jpg',
  })
  photo_url: string;

  @ApiProperty({
    description: '처리 결과 메시지',
    example: '프로필 이미지가 성공적으로 업로드되었습니다.',
  })
  message: string;
}
