import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { FirebaseModule } from './firebase/firebase.module';
import { PlacesModule } from './places/places.module';
import { HealthModule } from './health/health.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { AdminModule } from './admin/admin.module';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.dev.local', '.env.dev', '.env'],
      isGlobal: true,
    }),
    UsersModule,
    FirebaseModule,
    PlacesModule,
    HealthModule,
    PlaylistsModule,
    AdminModule,
    ChatModule,
  ],
})
export class AppModule {}
