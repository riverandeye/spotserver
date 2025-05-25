import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { PlaylistsModule } from '../playlists/playlists.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [FirebaseModule, forwardRef(() => PlaylistsModule), CommonModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
