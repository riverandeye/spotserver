import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [UsersModule, FirebaseModule],
})
export class AppModule {}
