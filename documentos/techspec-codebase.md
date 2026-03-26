RAG Policy API

1. Visão Geral
Este repositório implementa uma API REST em NestJS para:
1) indexar documentos de política (PDF ou texto) em um índice vetorial no Pinecone a partir de embeddings; e
2) responder perguntas de políticas usando Retrieval-Augmented Generation (RAG).

O sistema tem dois fluxos principais:
- Indexação: `POST /documents/upload` (multipart) -> extrai texto -> faz chunking -> embed -> `upsert` no Pinecone.
- Consulta: `POST /chat` (JSON) -> embed da pergunta -> busca no Pinecone (topK com metadados) -> filtra por score -> monta contexto + fontes -> chama `chat.completions` no OpenAI.

2. Stack Tecnológico
- Linguagem: TypeScript (Node.js)
- Framework Core: NestJS `@nestjs/*` (Controllers, Modules, Providers, Swagger)
- Build/Package: `npm` + Nest CLI (`nest build`, `nest start`)
- Banco de Dados: nenhum banco relacional. Persistência “lógica” é feita via metadados armazenados no Pinecone (por chunk).
- Interface/Protocolo:
  - REST (HTTP)
  - JSON para `/chat`
  - `multipart/form-data` para `/documents/upload`
- Dependências externas (críticas):
  - OpenAI: embeddings e chat completions (`openai`)
  - Pinecone: índice vetorial (`@pinecone-database/pinecone`)
  - PDF parsing: extração de texto em runtime (`pdf-parse`)
  - Swagger: contratos/descrições via `@nestjs/swagger`

3. Arquitetura e Padrões
3.1. Padrões Predominantes
O padrão predominante é a arquitetura modular do NestJS:
- Controllers expõem endpoints, validam entradas e traduzem falhas em HTTP errors (ex.: `BadRequestException`).
- Services encapsulam a lógica do domínio/tarefas do fluxo (RAG e indexação).
- Modules registram `providers` e exportam dependências entre domínios (ex.: `OpenAIModule` exporta `EmbeddingService`).

Mapa arquitetural por módulo/diretório:
- `src/app/chat/` (ChatModule): padrão NestJS Module + Controller/Service para o fluxo de RAG de perguntas.
- `src/app/documents/` (DocumentsModule): padrão NestJS Module + Controller/Service para indexação e extração.
- `src/app/embedding/` (OpenAIModule + EmbeddingService): provider factory do client `OpenAI` e um service dedicado a embeddings.
- `src/app/pinecone/` (PineconeModule + PineconeService): provider factory do Index do Pinecone e um service dedicado a `upsert/query`.

3.2. Abstrações Core (não-padrão / decisões relevantes)
- `EmbeddingService`
  - Objetivo: gerar embeddings com parâmetros fixos de modelo e dimensões.
  - Onde é usada: `DocumentsService` (embedMany de chunks) e `ChatService` (embed de pergunta).
- `PineconeService`
  - Objetivo: encapsular o `Index` do Pinecone e expor `upsert` e `query`.
  - Onde é usada: `DocumentsService` (upsert de records) e `ChatService` (query por similaridade).
- `chunkText(text, options)` (util)
  - Objetivo: normalizar whitespace e dividir em chunks com overlap.
  - Onde é usada: `DocumentsService` para preparar o conteúdo indexável.
- `extractTextFromFile(buffer, mimetype, fileName)` (util)
  - Objetivo: suportar `text/plain` e `application/pdf` e produzir texto extraído.
  - Onde é usada: `DocumentsService` para converter o upload em texto.

4. Design de Código e Convenções
4.1. Nomenclatura
- DTOs: `*Dto` em pastas `dto/` dentro do módulo.
- Contratos Swagger: DTOs com `@nestjs/swagger` (`ApiProperty`, `ApiPropertyOptional`, `ApiOkResponse`, `ApiBody`).
- Lógica principal:
  - `*Controller`: endpoints e validação mínima.
  - `*Service`: regras de negócio e orquestração do fluxo.
- Utilitários:
  - `*.util.ts` para transformações (chunking / extração).

4.2. Tratamento de Erros (padrão prático)
- Validações de input são feitas:
  - `ChatController`: valida `question` (string não vazia e com `trim()`).
  - `DocumentsController`: valida `file` via `ParseFilePipe` + `MaxFileSizeValidator` + `FileTypeValidator` (mime whitelisted).
  - `extractTextFromFile`: falhas de PDF -> `BadRequestException` com mensagem útil.
- Em `DocumentsService`, se o texto extraído estiver vazio (`!text`), é lançada `BadRequestException`.
- `ChatService`:
  - Se não houver matches com `score >= MIN_SCORE` ou se não houver `metadata.text`, retorna resposta padrão:
    - `answer`: mensagem de “não encontrei trechos”
    - `sources: []`
  - O serviço não tenta “tentar novamente” nem implementa fallback de API (não há retry/circuit breaker).

5. Integrações Externas
OpenAI
- Embeddings:
  - Modelo: `text-embedding-3-small`
  - Dimensões: `512` (`dimensions: EMBEDDING_DIMENSIONS`)
  - Endereço de uso: `openai.embeddings.create({ model, input, dimensions })`
- Chat completions:
  - Modelo: `gpt-4o-mini`
  - `stream: false`
  - Mensagens:
    - `system`: instruções para responder apenas baseado em políticas e sempre citar fontes com link
    - `user`: inclui contexto montado a partir dos chunks recuperados + a pergunta original

Pinecone
- Configuração:
  - `PINECONE_API_KEY` e `PINECONE_INDEX_NAME` (usados para criar o `Index` no `PineconeModule`)
- Indexação:
  - `documents.service.ts` upserta records com:
    - `id`: `${documentId}-${chunkIndex}`
    - `values`: embedding do chunk
    - `metadata`: `documentId`, `chunkIndex`, `text`, `title`, `sourceLink`
- Consulta:
  - `chat.service.ts` faz `query` com:
    - `topK: 5`
    - `includeMetadata: true`
  - Filtragem:
    - `score >= 0.5` (constante `MIN_SCORE`)
  - Fontes:
    - `sources` são deduplicadas por `documentId` usando `metadata.title` e `metadata.sourceLink`.

PDF Parsing
- `pdf-parse` extrai `result.text`.
- Limitação prática: PDFs sem texto selecionável podem resultar em `text` vazio e a indexação falhar com `BadRequestException`.

6. Pontos Críticos ("Gotchas")
- `conversationId` existe em `ChatRequestDto`, mas não é utilizado atualmente em `ChatService`.
- Sem persistência relacional: o “objeto documento” retornado no upload é montado localmente e os metadados permanentes do documento são reconstruídos via `metadata` dos chunks no Pinecone.
- `PINECONE_ENVIRONMENT` está no `.env.example`, mas não é referenciado no `PineconeModule` atual.
- Extração de PDF:
  - falhas/ausência de `result.text` -> indexação falha.
- Parâmetros RAG fixos hoje:
  - `TOP_K = 5`
  - `MIN_SCORE = 0.5`
  - chunking default: `maxChunkSize=800`, `overlap=100`
  Mudanças nesses valores impactam diretamente qualidade e custo.

7. Mapa de Navegação
- Entrada/HTTP
  - `src/main.ts`: bootstrap NestJS, CORS e Swagger em `GET /api`
  - `src/app.controller.ts`: health check `GET /` -> `Hello World!`
  - `src/app/chat/chat.controller.ts`: `POST /chat`
  - `src/app/documents/documents.controller.ts`: `POST /documents/upload`
- Fluxos/Serviços
  - `src/app/chat/chat.service.ts`: pipeline RAG (embed -> pinecone query -> filtro score -> contexto -> OpenAI chat)
  - `src/app/documents/documents.service.ts`: pipeline de indexação (extract -> chunk -> embedMany -> upsert)
  - `src/app/embedding/embedding.service.ts`: embeddings
  - `src/app/pinecone/pinecone.service.ts`: wrapper do Index (upsert/query)
- Utils de domínio
  - `src/app/documents/document-upload.util.ts`: whitelist de mime + extração de texto (txt/pdf)
  - `src/app/documents/chunking.util.ts`: chunkText

8. Guia de Padronização (Style Guide Prático)
Quando adicionar/alterar lógica:
- Mantenha o padrão NestJS:
  - Controllers: validação/HTTP, sem lógica pesada.
  - Services: orquestração do fluxo e regras de negócio.
  - Utilitários: transformações puras (chunking, parsing de arquivo).
- DTOs e Swagger:
  - Se o endpoint for público, crie/atualize DTOs com `@nestjs/swagger` para manter `GET /api` coerente.
- Contratos do Pinecone:
  - Preservar o esquema de `metadata` dos chunks: `documentId`, `chunkIndex`, `text`, `title`, `sourceLink`.
  - Qualquer mudança aqui deve ser acompanhada de ajuste no `ChatService` (montagem de contexto e sources).
- Parâmetros RAG:
  - Centralize constantes relevantes (topK, MIN_SCORE, modelos) e evite “magic numbers” espalhados.
- Tratamento de erro:
  - Use `BadRequestException` para falhas de validação de entrada e parse.
  - Se o fluxo RAG não encontrar contexto, retorne a resposta padrão com `sources: []` (não lance 500).

