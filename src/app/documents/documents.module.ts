import { Module } from '@nestjs/common';
import { OpenAIModule } from '../embedding/openai.module';
import { PineconeModule } from '../pinecone/pinecone.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [PineconeModule, OpenAIModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
