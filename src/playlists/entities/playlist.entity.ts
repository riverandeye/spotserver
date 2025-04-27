import { ApiProperty } from '@nestjs/swagger';

export class Thumbnail {
  @ApiProperty({
    description: '썸네일 이미지 URL',
    example: 'https://example.com/thumbnail1.jpg',
  })
  url: string;

  @ApiProperty({
    description: '썸네일 관련 장소 ID',
    example: 'OEwNifWHzz1eCXuRszc3',
  })
  place_id: string;

  constructor(data?: Partial<Thumbnail>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}

export class Playlist {
  @ApiProperty({
    description: '플레이리스트 고유 ID',
    example: 'playlist123',
  })
  id: string;

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
  description: string;

  @ApiProperty({
    description: '공개 여부',
    example: false,
    default: false,
  })
  is_visible: boolean;

  @ApiProperty({
    description: '플레이리스트 소유자 ID (사용자 참조)',
    example: 'bKRV9rQxETUFjIubqjCvIUuWVGq2',
  })
  owner: string;

  @ApiProperty({
    description: '플레이리스트에 포함된 장소 ID 목록',
    isArray: true,
    example: ['OEwNifWHzz1eCXuRszc3', '4IIaZDkXiYzUNUUzJyBg'],
  })
  places: string[];

  @ApiProperty({
    description: '플레이리스트 썸네일 객체 배열',
    isArray: true,
    type: Thumbnail,
    example: [
      {
        url: 'https://example.com/thumbnail1.jpg',
        place_id: 'OEwNifWHzz1eCXuRszc3',
      },
      {
        url: 'https://example.com/thumbnail2.jpg',
        place_id: '4IIaZDkXiYzUNUUzJyBg',
      },
    ],
    required: false,
  })
  thumbnails: Thumbnail[];

  @ApiProperty({
    description: '플레이리스트 유형',
    example: 'user',
    enum: ['user', 'official', 'featured'],
  })
  type: string;

  @ApiProperty({
    description: '생성 일시',
    example: '2023-12-29T16:41:30.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2023-12-29T16:41:30.000Z',
  })
  updated_at: Date;

  constructor(data?: Partial<Playlist>) {
    if (data) {
      Object.assign(this, data);

      // 날짜 변환
      if (data.created_at && !(data.created_at instanceof Date)) {
        this.created_at = new Date(data.created_at);
      }

      if (data.updated_at && !(data.updated_at instanceof Date)) {
        this.updated_at = new Date(data.updated_at);
      }

      // thumbnails 처리
      if (data.thumbnails) {
        this.thumbnails = Array.isArray(data.thumbnails)
          ? data.thumbnails.map((t) => new Thumbnail(t))
          : [];
      } else {
        this.thumbnails = [];
      }
    }
  }
}
