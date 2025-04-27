import { ApiProperty } from '@nestjs/swagger';

export class FindPlaylistsByIdsDto {
  @ApiProperty({
    description: '쉼표로 구분된 플레이리스트 ID 목록',
    example: 'playlist1,playlist2,playlist3',
    type: String,
  })
  ids: string;
}
