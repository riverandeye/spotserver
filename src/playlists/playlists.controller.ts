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
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Playlist } from './entities/playlist.entity';

@ApiTags('playlists')
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '새로운 플레이리스트 생성' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Playlist has been successfully created.',
    type: Playlist,
  })
  async create(
    @Body() createPlaylistDto: CreatePlaylistDto,
  ): Promise<Playlist> {
    return this.playlistsService.create(createPlaylistDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '모든 플레이리스트 조회' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '플레이리스트 유형으로 필터링 (user, official, featured)',
  })
  @ApiQuery({
    name: 'owner',
    required: false,
    description: '소유자 ID로 필터링',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '최대 결과 수',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All playlists retrieved successfully.',
    type: [Playlist],
  })
  async findAll(
    @Query('type') type?: string,
    @Query('owner') owner?: string,
    @Query('limit') limit?: number,
  ): Promise<Playlist[]> {
    return this.playlistsService.findAll({
      type,
      owner,
      limit: limit ? +limit : undefined,
    });
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '특정 사용자의 플레이리스트 조회' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User playlists retrieved successfully.',
    type: [Playlist],
  })
  async findByUser(@Param('userId') userId: string): Promise<Playlist[]> {
    return this.playlistsService.findByUser(userId);
  }

  @Get('place/:placeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '특정 장소가 포함된 플레이리스트 조회' })
  @ApiParam({ name: 'placeId', description: '장소 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Playlists containing the place retrieved successfully.',
    type: [Playlist],
  })
  async findByPlace(@Param('placeId') placeId: string): Promise<Playlist[]> {
    return this.playlistsService.findByPlace(placeId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ID로 플레이리스트 조회' })
  @ApiParam({ name: 'id', description: '플레이리스트 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Playlist retrieved successfully.',
    type: Playlist,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Playlist not found.',
  })
  async findOne(@Param('id') id: string): Promise<Playlist> {
    return this.playlistsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '플레이리스트 정보 업데이트' })
  @ApiParam({ name: 'id', description: '플레이리스트 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Playlist has been successfully updated.',
    type: Playlist,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Playlist not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePlaylistDto: UpdatePlaylistDto,
  ): Promise<Playlist> {
    return this.playlistsService.update(id, updatePlaylistDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '플레이리스트 삭제' })
  @ApiParam({ name: 'id', description: '플레이리스트 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Playlist has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Playlist not found.',
  })
  async remove(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.playlistsService.remove(id);
  }

  @Post(':id/places/:placeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '플레이리스트에 장소 추가' })
  @ApiParam({ name: 'id', description: '플레이리스트 ID' })
  @ApiParam({ name: 'placeId', description: '장소 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Place has been successfully added to the playlist.',
    type: Playlist,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Playlist or place not found.',
  })
  async addPlace(
    @Param('id') id: string,
    @Param('placeId') placeId: string,
  ): Promise<Playlist> {
    return this.playlistsService.addPlace(id, placeId);
  }

  @Delete(':id/places/:placeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '플레이리스트에서 장소 제거' })
  @ApiParam({ name: 'id', description: '플레이리스트 ID' })
  @ApiParam({ name: 'placeId', description: '장소 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Place has been successfully removed from the playlist.',
    type: Playlist,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Playlist not found.',
  })
  async removePlace(
    @Param('id') id: string,
    @Param('placeId') placeId: string,
  ): Promise<Playlist> {
    return this.playlistsService.removePlace(id, placeId);
  }
}
