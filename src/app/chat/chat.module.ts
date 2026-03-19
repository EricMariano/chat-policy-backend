import { Module } from '@nestjs/common';
import { OpenAIModule } from '../embedding/openai.module';
import { PineconeModule } from '../pinecone/pinecone.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [PineconeModule, OpenAIModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
