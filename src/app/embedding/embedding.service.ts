import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

export const EMBEDDING_DIMENSIONS = 512;

const EMBEDDING_MODEL = 'text-embedding-3-small' as const;
// futuramente colocar um historico de tokens
@Injectable()
export class EmbeddingService {
  constructor(private readonly openai: OpenAI) {}

  async embed(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    const embedding = response.data[0];
    if (!embedding?.embedding) {
      throw new Error('OpenAI embeddings.create returned no embedding');
    }
    return embedding.embedding;
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const response = await this.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    const sorted = [...response.data].sort((a, b) => a.index - b.index);
    return sorted.map((item) => item.embedding);
  }
}
