import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { EmbeddingService } from '../embedding/embedding.service';
import { PineconeService } from '../pinecone/pinecone.service';
import type { ChatResponseDto, ChatSourceDto } from './dto/chat-response.dto';

const CHAT_MODEL = 'gpt-4o-mini' as const;
const TOP_K = 5;
const MIN_SCORE = 0.5;

interface ChunkMetadata {
  documentId?: string;
  chunkIndex?: number;
  text?: string;
  title?: string;
  sourceLink?: string;
}

const SYSTEM_PROMPT = `Responda apenas com base nas políticas fornecidas, em inglês ou em português com base na lingua da pergunta. Sempre cite a fonte com o link. Se a pergunta não for sobre políticas, recuse educadamente.`;

@Injectable()
export class ChatService {
  constructor(
    private readonly embedding: EmbeddingService,
    private readonly pinecone: PineconeService,
    private readonly openai: OpenAI,
  ) {}

  // RAG flow: embed question → query Pinecone → build context and sources → OpenAI Chat Completions.
  async ask(question: string): Promise<ChatResponseDto> {
    const vector = await this.embedding.embed(question);

    const response = await this.pinecone.query({
      vector,
      topK: TOP_K,
      includeMetadata: true,
    });

    const matches = response.matches ?? [];
    const withScore = matches.filter(
      (m): m is typeof m & { score: number } =>
        m.score != null && m.score >= MIN_SCORE,
    );

    if (withScore.length === 0) {
      return {
        answer:
          'Não encontrei trechos relevantes nas políticas indexadas para essa pergunta. Por favor, reformule ou pergunte sobre o conteúdo das políticas disponíveis.',
        sources: [],
      };
    }

    const metadataList = withScore.map(
      (m) => m.metadata as ChunkMetadata | undefined,
    );
    const contextParts = metadataList
      .filter((m) => m?.text)
      .map((m) => m!.text as string);

    if (contextParts.length === 0) {
      return {
        answer:
          'Não encontrei trechos relevantes nas políticas indexadas para essa pergunta. Por favor, reformule ou pergunte sobre o conteúdo das políticas disponíveis.',
        sources: [],
      };
    }

    const context = contextParts.join('\n\n---\n\n');

    const uniqueDocumentIds = [
      ...new Set(
        metadataList
          .map((m) => m?.documentId)
          .filter((id): id is string => typeof id === 'string'),
      ),
    ];

    const sourcesByDocumentId = new Map<string, ChatSourceDto>();
    for (const m of metadataList) {
      const docId = m?.documentId;
      const title = m?.title;
      const sourceLink = m?.sourceLink;
      if (!docId || !title || !sourceLink) continue;
      if (sourcesByDocumentId.has(docId)) continue;
      sourcesByDocumentId.set(docId, {
        documentTitle: title,
        sourceLink,
      });
    }

    const sources: ChatSourceDto[] = uniqueDocumentIds
      .map((id) => sourcesByDocumentId.get(id))
      .filter((s): s is ChatSourceDto => Boolean(s));

    const userMessage = `Contexto (trechos das políticas):\n\n${context}\n\n---\n\nPergunta: ${question}`;

    const completion = await this.openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      stream: false,
    });

    const answer =
      completion.choices[0]?.message?.content?.trim() ??
      'Não foi possível gerar uma resposta.';

    return { answer, sources };
  }
}
