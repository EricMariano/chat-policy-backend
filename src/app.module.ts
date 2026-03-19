import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './app/chat/chat.module';
import { DocumentsModule } from './app/documents/documents.module';
import { OpenAIModule } from './app/embedding/openai.module';
import { PineconeModule } from './app/pinecone/pinecone.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PineconeModule,
    OpenAIModule,
    DocumentsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
