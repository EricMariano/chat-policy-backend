import { Inject, Injectable } from '@nestjs/common';
import type {
  Index,
  QueryOptions,
  QueryResponse,
  UpsertOptions,
} from '@pinecone-database/pinecone';
import { PINECONE_INDEX_NAME } from './pinecone.constants';

@Injectable()
export class PineconeService {
  constructor(
    @Inject(PINECONE_INDEX_NAME)
    private readonly index: Index,
  ) {}

  async upsert(options: UpsertOptions): Promise<void> {
    await this.index.upsert(options);
  }

  async query(options: QueryOptions): Promise<QueryResponse> {
    return this.index.query(options);
  }
}
