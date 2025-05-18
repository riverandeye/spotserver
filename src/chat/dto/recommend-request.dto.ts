import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecommendRequestDto {
  @ApiProperty({
    description: '음식 또는 맛집 관련 질문',
    example: '강남에서 분위기 좋은 식당 추천해줘',
  })
  query: string;

  @ApiPropertyOptional({
    description: '검색할 장소 최대 개수 (선택, 기본값 5)',
    example: 5,
  })
  max_results?: number;
}
