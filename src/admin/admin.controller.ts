import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  HttpException,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { AdminFirebaseService } from './services/admin.firebase.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Admin } from './entities/admin.entity';

@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminFirebaseService) {}

  @Post()
  @ApiOperation({ summary: '새 관리자 생성' })
  @ApiResponse({
    status: 201,
    description: '관리자가 성공적으로 생성됨',
    type: Admin,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async create(@Body() createAdminDto: CreateAdminDto): Promise<Admin> {
    try {
      return await this.adminService.create(createAdminDto);
    } catch (error) {
      throw new HttpException(
        error.message || '관리자 생성 실패',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: '모든 관리자 조회' })
  @ApiResponse({
    status: 200,
    description: '관리자 목록 조회 성공',
    type: [Admin],
  })
  async findAll(): Promise<Admin[]> {
    try {
      return await this.adminService.findAll();
    } catch (error) {
      throw new HttpException(
        error.message || '관리자 목록 조회 실패',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':uid')
  @ApiOperation({ summary: '특정 관리자 조회' })
  @ApiParam({ name: 'uid', description: '관리자 UID' })
  @ApiResponse({
    status: 200,
    description: '관리자 조회 성공',
    type: Admin,
  })
  @ApiResponse({ status: 404, description: '관리자를 찾을 수 없음' })
  async findOne(@Param('uid') uid: string): Promise<Admin> {
    try {
      return await this.adminService.findOne(uid);
    } catch (error) {
      throw new HttpException(
        error.message || '관리자를 찾을 수 없음',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Put(':uid')
  @ApiOperation({ summary: '관리자 정보 업데이트' })
  @ApiParam({ name: 'uid', description: '관리자 UID' })
  @ApiResponse({
    status: 200,
    description: '관리자 정보 업데이트 성공',
    type: Admin,
  })
  @ApiResponse({ status: 404, description: '관리자를 찾을 수 없음' })
  async update(
    @Param('uid') uid: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<Admin> {
    try {
      return await this.adminService.update(uid, updateAdminDto);
    } catch (error) {
      throw new HttpException(
        error.message || '관리자 정보 업데이트 실패',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':uid/permissions')
  @ApiOperation({ summary: '관리자 권한 설정' })
  @ApiParam({ name: 'uid', description: '관리자 UID' })
  @ApiResponse({
    status: 200,
    description: '관리자 권한 설정 성공',
    type: Admin,
  })
  @ApiResponse({ status: 404, description: '관리자를 찾을 수 없음' })
  async setPermissions(
    @Param('uid') uid: string,
    @Body() body: { permissions: string[] },
  ): Promise<Admin> {
    try {
      return await this.adminService.setPermissions(uid, body.permissions);
    } catch (error) {
      throw new HttpException(
        error.message || '관리자 권한 설정 실패',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':uid/disable')
  @ApiOperation({ summary: '관리자 계정 비활성화' })
  @ApiParam({ name: 'uid', description: '관리자 UID' })
  @ApiResponse({
    status: 200,
    description: '관리자 계정 비활성화 성공',
  })
  @ApiResponse({ status: 404, description: '관리자를 찾을 수 없음' })
  async disable(@Param('uid') uid: string): Promise<{ success: boolean }> {
    try {
      await this.adminService.disable(uid);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        error.message || '관리자 계정 비활성화 실패',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':uid')
  @ApiOperation({ summary: '관리자 계정 삭제' })
  @ApiParam({ name: 'uid', description: '관리자 UID' })
  @ApiResponse({
    status: 200,
    description: '관리자 계정 삭제 성공',
  })
  @ApiResponse({ status: 404, description: '관리자를 찾을 수 없음' })
  async remove(@Param('uid') uid: string): Promise<{ success: boolean }> {
    try {
      await this.adminService.remove(uid);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        error.message || '관리자 계정 삭제 실패',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('login')
  @ApiOperation({ summary: '관리자 로그인' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      properties: {
        token: { type: 'string', example: 'Bearer eyJhbGciOiJIUzI1NiIsIn...' },
        admin: { $ref: '#/components/schemas/Admin' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(
    @Body() loginDto: { email: string; password: string },
  ): Promise<{ token: string; admin: Admin }> {
    try {
      // 실제 구현에서는 Firebase Auth로 인증 처리
      // 여기서는 간단한 예시로 제공
      throw new HttpException(
        '로그인 기능은 Firebase SDK를 통해 클라이언트에서 직접 구현해야 합니다.',
        HttpStatus.NOT_IMPLEMENTED,
      );
    } catch (error) {
      throw new HttpException(
        error.message || '로그인 실패',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
