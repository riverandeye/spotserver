import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersFirebaseService } from '../firebase/services/users.firebase.service';
import { S3Service } from '../common/services/s3.service';
import { UploadProfileResponseDto } from './dto/upload-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersFirebaseService: UsersFirebaseService,
    private readonly s3Service: S3Service,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = new User({
      ...createUserDto,
      created_time: new Date(),
    });

    return this.usersFirebaseService.createUser(newUser);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersFirebaseService.findUserById(id);

    if (!user) {
      throw new NotFoundException(`User with UID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.usersFirebaseService.updateUser(
      id,
      updateUserDto,
    );

    if (!updatedUser) {
      throw new NotFoundException(`User with UID ${id} not found`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.usersFirebaseService.deleteUser(id);

    if (!result) {
      throw new NotFoundException(`User with UID ${id} not found`);
    }

    return {
      success: true,
      message: `User with UID ${id} has been deleted`,
    };
  }

  /**
   * 사용자 프로필 이미지를 업로드하고 업데이트합니다.
   * @param id 사용자 ID
   * @param file 업로드할 이미지 파일
   * @returns 업로드 결과 및 새 프로필 이미지 URL
   */
  async uploadProfileImage(
    id: string,
    file: Express.Multer.File,
  ): Promise<UploadProfileResponseDto> {
    // 사용자 존재 여부 확인
    const user = await this.findOne(id);

    // S3에 파일 업로드 (users/사용자ID/profile 경로에 저장)
    const photoUrl = await this.s3Service.uploadFile(
      file,
      `users/${id}/profile`,
    );

    // 사용자 정보 업데이트 (프로필 이미지 URL)
    const updatedUser = await this.update(id, { photo_url: photoUrl });

    return {
      success: true,
      photo_url: updatedUser.photo_url,
      message: '프로필 이미지가 성공적으로 업로드되었습니다.',
    };
  }
}
