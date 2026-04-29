import { Module } from '@nestjs/common';
import { RedisProvider } from './redis.provider';
import { RedisService } from './redis.service';
import { ChatGateway } from '../chat/chat.gateway';
import { ChatService } from '../chat/chat.service';
import { MessageService } from '../message/message.service';
import { MessageRepository } from '../message/message.repository';
import { QueueService } from '../queue/queue.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [
    RedisProvider,
    RedisService,
    ChatGateway,
    ChatService,
    MessageService,
    MessageRepository,
    QueueService,
    PrismaService,
  ],
  exports: [RedisProvider, RedisService],
})
export class RedisModule {}