import { ApiProperty } from '@nestjs/swagger';

export class User {
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
  })
  photo_url: string;

  @ApiProperty({
    description: '시스템 내 사용자 권한',
    example: 'user',
    enum: ['user', 'admin'],
  })
  role: string;

  @ApiProperty({
    description: '사용자 생성 시간',
    example: '2025-04-09T03:38:53.000Z',
  })
  created_time: Date;

  @ApiProperty({
    description: '사용자가 소유한 플레이리스트 ID 목록',
    example: ['2LzW5kxUk6g3rh9vGddY', 'IjpGOk87YZGPe3pZlUOj'],
    required: false,
    isArray: true,
    type: [String],
  })
  playlist_ids?: string[];

  @ApiProperty({
    description: '익명 사용자 여부',
    example: false,
    default: false,
    type: Boolean,
  })
  is_anonymous: boolean;

  constructor(data?: Partial<User>) {
    if (data) {
      Object.assign(this, data);

      // Convert timestamp to Date if needed
      if (data.created_time && !(data.created_time instanceof Date)) {
        this.created_time = new Date(data.created_time);
      }

      // Set default value for is_anonymous if not provided
      if (data.is_anonymous === undefined) {
        this.is_anonymous = false;
      }
    }
  }
}
