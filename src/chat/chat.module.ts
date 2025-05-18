import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PlacesModule } from '../places/places.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PlacesModule, ConfigModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
