import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';

export class CreatePlaylistDto {
  @ApiProperty({
    description: '플레이리스트 이름',
    example: 'fortune',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: '플레이리스트 설명',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '공개 여부',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_visible?: boolean;

  @ApiProperty({
    description: '플레이리스트 소유자 ID (사용자 참조)',
    example: 'bKRV9rQxETUFjIubqjCvIUuWVGq2',
  })
  @IsNotEmpty({ message: '플레이리스트 소유자(owner)는 필수 항목입니다.' })
  @IsString()
  owner: string;

  @ApiProperty({
    description: '플레이리스트에 포함된 장소 ID 목록',
    isArray: true,
    example: ['OEwNifWHzz1eCXuRszc3', '4IIaZDkXiYzUNUUzJyBg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  places?: string[];

  @ApiProperty({
    description: '플레이리스트 유형',
    example: 'user',
    enum: ['user', 'official', 'featured'],
    default: 'user',
    required: false,
  })
  @IsOptional()
  @IsEnum(['user', 'official', 'featured'])
  type?: string;
}
