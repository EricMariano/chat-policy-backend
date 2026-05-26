import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MessageRepository } from './message.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatModule } from '../chat/chat.module';
import { QueueService } from '../queue/queue.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule, ChatModule],
  controllers: [MessageController],
  providers: [
    MessageService,
    MessageRepository,
    QueueService
  ],
  exports: [MessageService, QueueService],
})
export class MessageModule {}
