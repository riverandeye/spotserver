import { ApiProperty } from '@nestjs/swagger';

export class Admin {
  @ApiProperty({
    description: '관리자 고유 식별자 (Firebase UID)',
    example: 'AdminUID123456',
  })
  uid: string;

  @ApiProperty({
    description: '관리자 이메일 주소',
    example: 'admin@spotapp.com',
  })
  email: string;

  @ApiProperty({
    description: '관리자 표시 이름',
    example: 'SpotAdmin',
  })
  display_name: string;

  @ApiProperty({
    description: '관리자 비밀번호(저장용이 아닌 API 통신용)',
    example: '',
  })
  password: string;

  @ApiProperty({
    description: '비밀번호 확인 번호',
    example: '',
  })
  password_verification_number: string;

  @ApiProperty({
    description: '관리자 권한 레벨',
    example: 'super_admin',
    enum: ['admin', 'super_admin'],
  })
  role: string;

  @ApiProperty({
    description: '관리자 인증 토큰',
    example: '',
  })
  token: string;

  @ApiProperty({
    description: '관리자 권한',
    isArray: true,
    example: [
      'manage_users',
      'manage_places',
      'manage_playlists',
      'approve_content',
    ],
  })
  permissions: string[];

  @ApiProperty({
    description: '마지막 로그인 시간',
    example: '2025-04-21T01:02:04.000Z',
  })
  last_login: Date;

  @ApiProperty({
    description: '계정 생성 시간',
    example: '2025-04-21T13:02:20.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: '최근 정보 업데이트 시간',
    example: '2025-04-21T13:02:38.000Z',
  })
  updated_at: Date;

  constructor(data?: Partial<Admin>) {
    if (data) {
      Object.assign(this, data);

      // Convert timestamps to Date if needed
      if (data.last_login && !(data.last_login instanceof Date)) {
        this.last_login = new Date(data.last_login);
      }

      if (data.created_at && !(data.created_at instanceof Date)) {
        this.created_at = new Date(data.created_at);
      }

      if (data.updated_at && !(data.updated_at instanceof Date)) {
        this.updated_at = new Date(data.updated_at);
      }
    }
  }
}
