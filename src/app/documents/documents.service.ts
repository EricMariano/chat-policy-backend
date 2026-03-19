import { BadRequestException, Injectable } from '@nestjs/common';
import { EmbeddingService } from '../embedding/embedding.service';
import { PineconeService } from '../pinecone/pinecone.service';
import { chunkText } from './chunking.util';
import { extractTextFromFile } from './document-upload.util';
import type { UploadDocumentDto } from './dto/upload-document.dto';
import { randomUUID } from 'crypto';

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly embedding: EmbeddingService,
    private readonly pinecone: PineconeService,
  ) {}

  private normalizeOptionalId(id?: string): string | null {
    if (!id) return null;
    const trimmed = id.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private async indexDocumentFromText(params: {
    title: string;
    sourceLink: string;
    text: string;
    fileName?: string;
    createdById?: string;
  }) {
    const createdById = this.normalizeOptionalId(params.createdById);

    // Without Prisma, we generate a new document id and persist metadata inside Pinecone.
    const docId = randomUUID();
    const doc = {
      id: docId,
      title: params.title,
      sourceLink: params.sourceLink,
      fileName: params.fileName ?? null,
      status: 'active',
      createdById,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const chunks = chunkText(params.text);
    if (chunks.length === 0) {
      return doc;
    }

    const embeddings = await this.embedding.embedMany(chunks);
    const records = embeddings.map((values, i) => ({
      id: `${doc.id}-${i}`,
      values,
      metadata: {
        documentId: doc.id,
        chunkIndex: i,
        text: chunks[i],
        title: params.title,
        sourceLink: params.sourceLink,
      },
    }));

    await this.pinecone.upsert({ records });

    return doc;
  }

  async createDocumentFromFile(file: UploadedFile, dto: UploadDocumentDto) {
    const text = await extractTextFromFile(
      file.buffer,
      file.mimetype,
      file.originalname,
    );
    if (!text) {
      throw new BadRequestException(
        'No text could be extracted from the file. Ensure the PDF contains selectable text or upload a non-empty .txt file.',
      );
    }
    return this.indexDocumentFromText({
      title: dto.title,
      sourceLink: dto.sourceLink,
      text,
      fileName: file.originalname,
      createdById: dto.createdById,
    });
  }
}
