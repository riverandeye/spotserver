import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { PlaylistsService } from '../playlists/playlists.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => PlaylistsService))
    private readonly playlistsService: PlaylistsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '새 사용자 생성' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User has been successfully created.',
    type: User,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request.' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    // 사용자 생성
    const createdUser = await this.usersService.create(createUserDto);

    try {
      // 기본 플레이리스트 생성
      const defaultPlaylist = await this.playlistsService.createDefaultPlaylist(
        createdUser.uid,
      );

      // 플레이리스트 ID를 사용자 정보에 업데이트
      const playlistIds = createdUser.playlist_ids || [];
      if (!playlistIds.includes(defaultPlaylist.id)) {
        playlistIds.push(defaultPlaylist.id);
      }

      // 사용자 정보 업데이트
      const updatedUser = await this.usersService.update(createdUser.uid, {
        default_playlist: defaultPlaylist.id,
        playlist_ids: playlistIds,
      });

      return updatedUser;
    } catch (error) {
      console.warn(
        `Failed to create default playlist for user ${createdUser.uid}:`,
        error,
      );
      return createdUser;
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ID로 사용자 조회' })
  @ApiParam({ name: 'id', description: '사용자 ID (Firebase UID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully.',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async findOne(@Param('id') id: string): Promise<User> {
    // 사용자 조회
    const user = await this.usersService.findOne(id);

    // 기본 플레이리스트가 없으면 생성
    if (!user.default_playlist) {
      try {
        const defaultPlaylist =
          await this.playlistsService.createDefaultPlaylist(user.uid);

        // 플레이리스트 ID를 사용자 정보에 업데이트
        const playlistIds = user.playlist_ids || [];
        if (!playlistIds.includes(defaultPlaylist.id)) {
          playlistIds.push(defaultPlaylist.id);
        }

        // 사용자 정보 업데이트
        const updatedUser = await this.usersService.update(user.uid, {
          default_playlist: defaultPlaylist.id,
          playlist_ids: playlistIds,
        });

        return updatedUser;
      } catch (error) {
        console.warn(
          `Failed to create default playlist for user ${user.uid}:`,
          error,
        );
      }
    }

    return user;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 정보 업데이트' })
  @ApiParam({ name: 'id', description: '사용자 ID (Firebase UID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User has been successfully updated.',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 삭제' })
  @ApiParam({ name: 'id', description: '사용자 ID (Firebase UID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async remove(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.usersService.remove(id);
  }
}
