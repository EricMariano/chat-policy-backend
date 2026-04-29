import { Module } from '@nestjs/common';
import { OpenAIModule } from '../embedding/openai.module';
import { PineconeModule } from '../pinecone/pinecone.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { MessageService } from '../message/message.service';
import { MessageRepository } from '../message/message.repository';
import { QueueService } from '../queue/queue.service';
import { RedisService } from '../redis/redis.service';
import { RedisModule } from '../redis/redis.module';
import { RedisProvider } from '../redis/redis.provider';

@Module({
  imports: [PineconeModule, OpenAIModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    PrismaService,
    MessageService,
    MessageRepository,
    QueueService,
    RedisModule,
    RedisProvider,
    RedisService
  ],
  exports: [ChatService, ChatGateway, PrismaService],
})
export class ChatModule {}
