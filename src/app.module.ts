import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { FirebaseModule } from './firebase/firebase.module';
import { PlacesModule } from './places/places.module';
import { HealthModule } from './health/health.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [UsersModule, FirebaseModule, PlacesModule, HealthModule],
})
export class AppModule {}
