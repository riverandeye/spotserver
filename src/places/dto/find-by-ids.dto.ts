import { ApiProperty } from '@nestjs/swagger';

export class FindPlacesByIdsDto {
  @ApiProperty({
    description: '쉼표로 구분된 장소 ID 목록',
    example: 'place1,place2,place3',
    type: String,
  })
  ids: string;
}
