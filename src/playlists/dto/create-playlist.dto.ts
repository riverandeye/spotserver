import { ApiProperty } from '@nestjs/swagger';

export class CreatePlaylistDto {
  @ApiProperty({
    description: '플레이리스트 이름',
    example: 'fortune',
  })
  name: string;

  @ApiProperty({
    description: '플레이리스트 설명',
    example: '',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: '공개 여부',
    example: false,
    default: false,
    required: false,
  })
  is_visible?: boolean;

  @ApiProperty({
    description: '플레이리스트 소유자 ID (사용자 참조)',
    example: 'bKRV9rQxETUFjIubqjCvIUuWVGq2',
  })
  owner: string;

  @ApiProperty({
    description: '플레이리스트에 포함된 장소 ID 목록',
    isArray: true,
    example: ['OEwNifWHzz1eCXuRszc3', '4IIaZDkXiYzUNUUzJyBg'],
    required: false,
  })
  places?: string[];

  @ApiProperty({
    description: '플레이리스트 유형',
    example: 'user',
    enum: ['user', 'official', 'featured'],
    default: 'user',
    required: false,
  })
  type?: string;
}
