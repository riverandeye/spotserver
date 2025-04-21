import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({
    description: '관리자 이메일 주소',
    example: 'admin@spotapp.com',
  })
  email: string;

  @ApiProperty({
    description: '관리자 비밀번호',
    example: 'StrongPassword123!',
  })
  password: string;

  @ApiProperty({
    description: '비밀번호 확인 번호',
    example: '',
    required: false,
  })
  password_verification_number?: string;

  @ApiProperty({
    description: '관리자 표시 이름',
    example: 'SpotAdmin',
  })
  display_name: string;

  @ApiProperty({
    description: '관리자 권한 레벨',
    example: 'admin',
    enum: ['admin', 'super_admin'],
    default: 'admin',
    required: false,
  })
  role?: string;

  @ApiProperty({
    description: '관리자 인증 토큰',
    example: '',
    required: false,
  })
  token?: string;

  @ApiProperty({
    description: '관리자 권한',
    isArray: true,
    example: [
      'manage_users',
      'manage_places',
      'manage_playlists',
      'approve_content',
    ],
    default: [],
    required: false,
  })
  permissions?: string[] = [];
}
