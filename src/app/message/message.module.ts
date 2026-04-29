import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MessageRepository } from './message.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatService } from '../chat/chat.service';
import { QueueService } from '../queue/queue.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [MessageController],
  providers: [
    MessageService,
    MessageRepository,
    ChatService,
    QueueService
  ],
  exports: [MessageService, ChatService, QueueService],
})
export class MessageModule {}
