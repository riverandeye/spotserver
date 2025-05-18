import { ApiProperty } from '@nestjs/swagger';
import { Place } from '../../places/entities/place.entity';

export class RecommendResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Looking for a great place to eat in Gangnam?...' })
  message: string;

  @ApiProperty({
    type: [Place],
    description: '추천된 장소 목록',
  })
  places: Place[];
}
