import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersFirebaseService } from '../firebase/services/users.firebase.service';

@Injectable()
export class UsersService {
  constructor(private readonly usersFirebaseService: UsersFirebaseService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = new User({
      ...createUserDto,
      created_time: new Date(),
    });

    return this.usersFirebaseService.createUser(newUser);
  }

  async findAll(): Promise<User[]> {
    return this.usersFirebaseService.findAllUsers();
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
}
