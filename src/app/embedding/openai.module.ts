import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EmbeddingService } from './embedding.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: OpenAI,
      inject: [ConfigService],
      useFactory: (config: ConfigService): OpenAI => {
        const apiKey = config.getOrThrow<string>('OPENAI_API_KEY');
        return new OpenAI({ apiKey });
      },
    },
    EmbeddingService,
  ],
  exports: [EmbeddingService, OpenAI],
})
export class OpenAIModule {}
