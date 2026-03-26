---
trigger: model_decision
description: Usar sempre que precisar tomar decisão arquitetural ou técnicas
---
Use `documentos/techspec-codebase.md` como **fonte de verdade** para qualquer decisão arquitetural/técnica neste repositório. Antes de propor mudanças, confirme e preserve o comportamento e os contratos abaixo:

1. **Arquitetura NestJS modular**: `*Controller` (HTTP + validação) chama `*Service` (orquestração); integrações ficam em `*Module/*Service` dedicados (ex.: `OpenAIModule`, `PineconeModule`).
2. **Swagger/DTOs**: para endpoints públicos, manter DTOs com `@nestjs/swagger` (`ApiProperty*`) para coerência do `GET /api`.
3. **Pipeline RAG (parâmetros atuais)**:
   - Embeddings: `text-embedding-3-small` com `512` dimensões (`EmbeddingService`).
   - Pinecone query: `topK=5` e `includeMetadata=true` (`ChatService`).
   - Filtro: `score >= 0.5` (`MIN_SCORE`).
   - Chat LLM: `gpt-4o-mini` com `stream: false`.
4. **Chunking e contexto**:
   - Chunking default: `maxChunkSize=800`, `overlap=100`.
   - Contexto: `join(textChunks, "\n\n---\n\n")` e montagem do `userMessage` com `Contexto (...)` + `Pergunta`.
5. **Esquema de metadados no Pinecone (por chunk)**: `documentId`, `chunkIndex`, `text`, `title`, `sourceLink` (usado para montar `sources` deduplicadas).
6. **Gotchas**: `conversationId` existe no DTO, mas não é usado hoje; upload de PDF pode falhar se `pdf-parse` retornar texto vazio (`BadRequestException`).

Se uma mudança proposta conflitar com qualquer item acima, priorize a spec e proponha um ajuste mantendo o comportamento atual esperado.
