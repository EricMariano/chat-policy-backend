import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import type { Index } from '@pinecone-database/pinecone';
import { PINECONE_INDEX_NAME } from './pinecone.constants';
import { PineconeService } from './pinecone.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PINECONE_INDEX_NAME,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Index => {
        const apiKey = config.getOrThrow<string>('PINECONE_API_KEY');
        const indexName = config.getOrThrow<string>('PINECONE_INDEX_NAME');
        const pc = new Pinecone({ apiKey });
        return pc.index({ name: indexName });
      },
    },
    PineconeService,
  ],
  exports: [PineconeService],
})
export class PineconeModule {}
