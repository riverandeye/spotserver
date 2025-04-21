import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Place } from './entities/place.entity';

@ApiTags('places')
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '새로운 장소 생성' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '장소가 성공적으로 생성되었습니다.',
    type: Place,
  })
  async create(@Body() createPlaceDto: CreatePlaceDto): Promise<Place> {
    return this.placesService.create(createPlaceDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '모든 장소 조회' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '장소 유형으로 필터링 (예: Bar, Restaurant)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '최대 결과 수',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '모든 장소 목록 반환',
    type: [Place],
  })
  async findAll(
    @Query('type') type?: string,
    @Query('limit') limit?: number,
  ): Promise<Place[]> {
    return this.placesService.findAll({
      type,
      limit: limit ? +limit : undefined,
    });
  }

  @Get('main')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '메인 페이지용 장소 조회' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '최대 결과 수',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '메인 페이지용 장소 목록 반환',
    type: [Place],
  })
  async getMainPagePlaces(@Query('limit') limit?: number): Promise<Place[]> {
    return this.placesService.getMainPagePlaces(limit ? +limit : 10);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '장소 검색' })
  @ApiQuery({
    name: 'q',
    required: true,
    description: '검색어 (장소명, 설명 등)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '검색 결과 장소 목록 반환',
    type: [Place],
  })
  async search(@Query('q') query: string): Promise<Place[]> {
    return this.placesService.search(query);
  }

  @Get('tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '태그로 장소 검색' })
  @ApiQuery({
    name: 'tags',
    required: true,
    description: '태그 목록 (쉼표로 구분, 예: "cocktails,bar")',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '태그로 필터링된 장소 목록 반환',
    type: [Place],
  })
  async findByTags(@Query('tags') tagsString: string): Promise<Place[]> {
    const tags = tagsString.split(',').map((tag) => tag.trim());
    return this.placesService.findByTags(tags);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ID로 장소 조회' })
  @ApiParam({ name: 'id', description: '장소 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '장소 정보 반환',
    type: Place,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '장소를 찾을 수 없음',
  })
  async findOne(@Param('id') id: string): Promise<Place> {
    return this.placesService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '장소 정보 업데이트' })
  @ApiParam({ name: 'id', description: '장소 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '장소가 성공적으로 업데이트되었습니다.',
    type: Place,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '장소를 찾을 수 없음',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePlaceDto: UpdatePlaceDto,
  ): Promise<Place> {
    return this.placesService.update(id, updatePlaceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '장소 삭제' })
  @ApiParam({ name: 'id', description: '장소 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '장소가 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '장소를 찾을 수 없음',
  })
  async remove(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.placesService.remove(id);
  }
}
