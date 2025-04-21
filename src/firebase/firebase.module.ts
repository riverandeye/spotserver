import { Module } from '@nestjs/common';
import { UsersFirebaseService } from './services/users.firebase.service';
import { PlacesFirebaseService } from './services/places.firebase.service';
import { PlaylistsFirebaseService } from './services/playlists.firebase.service';

@Module({
  providers: [
    UsersFirebaseService,
    PlacesFirebaseService,
    PlaylistsFirebaseService,
  ],
  exports: [
    UsersFirebaseService,
    PlacesFirebaseService,
    PlaylistsFirebaseService,
  ],
})
export class FirebaseModule {}
