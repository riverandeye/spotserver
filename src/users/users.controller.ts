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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { PlaylistsService } from '../playlists/playlists.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadProfileResponseDto } from './dto/upload-profile.dto';

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
    return await this.usersService.create(createUserDto);
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
    return await this.usersService.findOne(id);
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

  @Post(':id/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 프로필 이미지 업로드' })
  @ApiParam({ name: 'id', description: '사용자 ID (Firebase UID)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '업로드할 프로필 이미지 파일',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '프로필 이미지가 성공적으로 업로드됨',
    type: UploadProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 또는 파일 형식',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '사용자를 찾을 수 없음',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
          return callback(
            new BadRequestException('이미지 파일만 업로드 가능합니다.'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadProfileImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadProfileResponseDto> {
    if (!file) {
      throw new BadRequestException('이미지 파일이 필요합니다.');
    }

    return this.usersService.uploadProfileImage(id, file);
  }
}
