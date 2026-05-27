import { Module } from '@nestjs/common';
import { OpenAIModule } from '../embedding/openai.module';
import { PineconeModule } from '../pinecone/pinecone.module';
import { RedisModule } from '../redis/redis.module';
import { MinioModule } from '../minio/minio.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@Module({
  imports: [PineconeModule, OpenAIModule, RedisModule, MinioModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsRepository, PrismaService, QueueService],
  exports: [DocumentsService, PrismaService, QueueService],
})
export class DocumentsModule {}
