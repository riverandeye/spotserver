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
   * Upload and update user profile image.
   * @param id User ID
   * @param file Image file to upload
   * @returns Upload result and new profile image URL
   */
  async uploadProfileImage(
    id: string,
    file: Express.Multer.File,
  ): Promise<UploadProfileResponseDto> {
    // Check if user exists
    const user = await this.findOne(id);

    // Upload file to S3 (store in users/userID/profile path)
    const photoUrl = await this.s3Service.uploadFile(
      file,
      `users/${id}/profile`,
    );

    // Update user information (profile image URL)
    const updatedUser = await this.update(id, { photo_url: photoUrl });

    return {
      success: true,
      photo_url: updatedUser.photo_url,
      message: 'Profile image successfully uploaded.',
    };
  }
}
