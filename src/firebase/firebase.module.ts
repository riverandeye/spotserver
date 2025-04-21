import { Module } from '@nestjs/common';
import { UsersFirebaseService } from './services/users.firebase.service';
import { PlacesFirebaseService } from './services/places.firebase.service';

@Module({
  providers: [UsersFirebaseService, PlacesFirebaseService],
  exports: [UsersFirebaseService, PlacesFirebaseService],
})
export class FirebaseModule {}
