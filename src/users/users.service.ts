import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersFirebaseService } from '../firebase/services/users.firebase.service';
import { PlaylistsService } from '../playlists/playlists.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersFirebaseService: UsersFirebaseService,
    private readonly playlistsService: PlaylistsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = new User({
      ...createUserDto,
      created_time: new Date(),
    });

    const createdUser = await this.usersFirebaseService.createUser(newUser);

    try {
      const defaultPlaylist = await this.playlistsService.createDefaultPlaylist(
        createdUser.uid,
      );

      const playlistIds = createdUser.playlist_ids || [];
      if (!playlistIds.includes(defaultPlaylist.id)) {
        playlistIds.push(defaultPlaylist.id);
      }

      await this.usersFirebaseService.updateUser(createdUser.uid, {
        default_playlist: defaultPlaylist.id,
        playlist_ids: playlistIds,
      });

      return {
        ...createdUser,
        default_playlist: defaultPlaylist.id,
        playlist_ids: playlistIds,
      };
    } catch (error) {
      console.warn(
        `Failed to create default playlist for user ${createdUser.uid}:`,
        error,
      );
      return createdUser;
    }
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersFirebaseService.findUserById(id);

    if (!user) {
      throw new NotFoundException(`User with UID ${id} not found`);
    }

    if (!user.default_playlist) {
      try {
        const defaultPlaylist =
          await this.playlistsService.createDefaultPlaylist(user.uid);

        const playlistIds = user.playlist_ids || [];
        if (!playlistIds.includes(defaultPlaylist.id)) {
          playlistIds.push(defaultPlaylist.id);
        }

        await this.usersFirebaseService.updateUser(user.uid, {
          default_playlist: defaultPlaylist.id,
          playlist_ids: playlistIds,
        });

        return {
          ...user,
          default_playlist: defaultPlaylist.id,
          playlist_ids: playlistIds,
        };
      } catch (error) {
        console.warn(
          `Failed to create default playlist for user ${user.uid}:`,
          error,
        );
      }
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
