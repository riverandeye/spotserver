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
  NotFoundException,
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
import { UsersService } from '../users/users.service';

@ApiTags('playlists')
@Controller('playlists')
export class PlaylistsController {
  constructor(
    private readonly playlistsService: PlaylistsService,
    private readonly usersService: UsersService,
  ) {}

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
    // 플레이리스트 생성
    const createdPlaylist =
      await this.playlistsService.create(createPlaylistDto);

    try {
      // 사용자 정보 가져오기
      const userId = createPlaylistDto.owner;
      const user = await this.usersService.findOne(userId);

      if (user) {
        // 현재 playlist_ids 배열 가져오기 (없으면 빈 배열로 초기화)
        const currentPlaylistIds = user.playlist_ids || [];

        // 이미 배열에 있는지 확인
        if (!currentPlaylistIds.includes(createdPlaylist.id)) {
          // 새 플레이리스트 ID 추가
          const updatedPlaylistIds = [
            ...currentPlaylistIds,
            createdPlaylist.id,
          ];

          // 사용자 문서 업데이트
          await this.usersService.update(userId, {
            playlist_ids: updatedPlaylistIds,
          });
        }
      }
    } catch (error) {
      console.error(`Error updating user's playlist_ids:`, error);
      // 플레이리스트 생성은 성공했으므로 오류를 무시하고 계속 진행
      console.warn(
        `Playlist ${createdPlaylist.id} was created but user's playlist_ids field was not updated`,
      );
    }

    return createdPlaylist;
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
