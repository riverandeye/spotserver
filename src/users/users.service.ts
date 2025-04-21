import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class UsersService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = new User({
      ...createUserDto,
      created_time: new Date(),
    });

    return this.firebaseService.createUser(newUser);
  }

  async findAll(): Promise<User[]> {
    return this.firebaseService.findAllUsers();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.firebaseService.findUserById(id);

    if (!user) {
      throw new NotFoundException(`User with UID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.firebaseService.updateUser(
      id,
      updateUserDto,
    );

    if (!updatedUser) {
      throw new NotFoundException(`User with UID ${id} not found`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.firebaseService.deleteUser(id);

    if (!result) {
      throw new NotFoundException(`User with UID ${id} not found`);
    }

    return {
      success: true,
      message: `User with UID ${id} has been deleted`,
    };
  }
}
