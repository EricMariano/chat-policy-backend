import { Module } from '@nestjs/common';
import { OpenAIModule } from '../embedding/openai.module';
import { PineconeModule } from '../pinecone/pinecone.module';
import { RedisModule } from '../redis/redis.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@Module({
  imports: [PineconeModule, OpenAIModule, RedisModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, PrismaService, QueueService],
  exports: [DocumentsService, PrismaService, QueueService],
})
export class DocumentsModule {}
