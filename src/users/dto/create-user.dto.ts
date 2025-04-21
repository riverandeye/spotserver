import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자 고유 식별자 (Firebase UID)',
    example: '0AWIzKnEtzOJh3SG0nJVD1RMvZo2',
  })
  uid: string;

  @ApiProperty({
    description: '사용자 이메일 주소',
    example: 'anazarovaviktoria@gmail.com',
  })
  email: string;

  @ApiProperty({
    description: '사용자 표시 이름',
    example: 'Vika',
  })
  display_name: string;

  @ApiProperty({
    description: '사용자 전체 이름',
    example: 'Viktoriia',
  })
  full_name: string;

  @ApiProperty({
    description: '사용자 프로필 사진 URL',
    example: 'https://example.com/photos/user.jpg',
    required: false,
  })
  photo_url?: string;

  @ApiProperty({
    description: '시스템 내 사용자 권한',
    example: 'user',
    enum: ['user', 'admin'],
    default: 'user',
    required: false,
  })
  role?: string;
}
