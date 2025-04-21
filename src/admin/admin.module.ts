import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminFirebaseService } from './services/admin.firebase.service';

@Module({
  controllers: [AdminController],
  providers: [AdminFirebaseService],
  exports: [AdminFirebaseService],
})
export class AdminModule {}
