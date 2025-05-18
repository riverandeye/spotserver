import { ApiProperty } from '@nestjs/swagger';

class PlaceDto {
  @ApiProperty({ example: 'place123' })
  id: string;
  @ApiProperty({ example: 'Bar Dhowon22' })
  name: string;
  @ApiProperty({
    example: '2 층, 17 Mareunnae-ro, Jung-gu, Seoul, South Korea',
  })
  address: string;
  @ApiProperty({ example: 'Bar' })
  type: string;
  @ApiProperty({ example: 'Bar Dhowon22 is taking the name after the year...' })
  description: string;
  @ApiProperty({ example: ['https://...'], isArray: true })
  images: string[];
  @ApiProperty({ example: 'https://...' })
  first_image: string;
}

export class RecommendResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
  @ApiProperty({ example: 'Looking for a great place to eat in Gangnam?...' })
  message: string;
  @ApiProperty({ type: [PlaceDto] })
  places: PlaceDto[];
}
