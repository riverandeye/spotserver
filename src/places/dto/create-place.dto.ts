import { ApiProperty } from '@nestjs/swagger';
import { GeoPoint } from '../entities/place.entity';

export class CreatePlaceDto {
  @ApiProperty({
    description: '장소 이름 (영문)',
    example: 'Bar Dhowon22',
  })
  name: string;

  @ApiProperty({
    description: '장소 이름 (한글)',
    example: '도원22',
  })
  name_cor: string;

  @ApiProperty({
    description: '장소 주소 (영문)',
    example: '2 층, 17 Mareunnae-ro, Jung-gu, Seoul, South Korea',
  })
  address: string;

  @ApiProperty({
    description: '장소 주소 (한글)',
    example: '서울 중구 마른내로 17',
  })
  address_cor: string;

  @ApiProperty({
    description: '지역 이름',
    example: 'Jung-gu',
  })
  area_name: string;

  @ApiProperty({
    description: '도시 이름',
    example: 'Seoul',
  })
  city: string;

  @ApiProperty({
    description: '장소 좌표 (위도, 경도)',
    example: [37.5649719, 126.9896914],
    type: Array,
  })
  coord: number[];

  @ApiProperty({
    description: '장소 설명',
    example:
      'Bar Dhowon22 is taking the name after the year that the building was constructed...',
  })
  description: string;

  @ApiProperty({
    description: '대표 이미지 URL',
    example:
      'https://firebasestorage.googleapis.com/v0/b/spot-app-2e3ed.appspot.com/o/users%2FdwKidOGXlBhlSLG1GDrSiIANJKV2%2Fuploads%2F1703835660608000.jpg?alt=media&token=a2d5d86b-10ec-40ae-9b3e-a7ee7cde884e',
  })
  first_image: string;

  @ApiProperty({
    description: '이미지 URL 목록',
    isArray: true,
    example: [
      'https://firebasestorage.googleapis.com/v0/b/...',
      'https://firebasestorage.googleapis.com/v0/b/...',
    ],
  })
  images: string[];

  @ApiProperty({
    description: '메인 페이지 노출 여부',
    example: false,
    required: false,
    default: false,
  })
  in_main_page?: boolean;

  @ApiProperty({
    description: '인스타그램 아이디',
    example: 'dhowon22_bar',
    required: false,
  })
  instagram?: string;

  @ApiProperty({
    description: '승인 여부',
    example: true,
    required: false,
    default: false,
  })
  is_confirm?: boolean;

  @ApiProperty({
    description: '외부 링크 1',
    example: '',
    required: false,
  })
  link_1?: string;

  @ApiProperty({
    description: '외부 링크 2',
    example: '',
    required: false,
  })
  link_2?: string;

  @ApiProperty({
    description: '영업 시간',
    example: '6:30pm-2am',
    required: false,
  })
  operation_hours?: string;

  @ApiProperty({
    description: '전화번호',
    example: '',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: '태그 목록',
    isArray: true,
    example: ['foreigner-friendly', 'cozy', 'local bar'],
    required: false,
  })
  tags?: string[];

  @ApiProperty({
    description: '장소 유형',
    example: 'Bar',
  })
  type: string;
}
