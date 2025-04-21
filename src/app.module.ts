import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { FirebaseModule } from './firebase/firebase.module';
import { PlacesModule } from './places/places.module';
import { HealthModule } from './health/health.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    UsersModule,
    FirebaseModule,
    PlacesModule,
    HealthModule,
    PlaylistsModule,
    AdminModule,
  ],
})
export class AppModule {}
