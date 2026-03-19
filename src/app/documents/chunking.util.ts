export interface ChunkOptions {
  maxChunkSize?: number;
  overlap?: number;
}

const DEFAULT_MAX_CHUNK_SIZE = 800;
const DEFAULT_OVERLAP = 100;

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const maxChunkSize = options.maxChunkSize ?? DEFAULT_MAX_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  const normalized = text.trim().replace(/\s+/g, ' ');
  if (normalized.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + maxChunkSize, normalized.length);
    if (end < normalized.length) {
      const lastSpace = normalized.lastIndexOf(' ', end);
      if (lastSpace > start) end = lastSpace;
    }
    chunks.push(normalized.slice(start, end).trim());
    if (end >= normalized.length) break;
    start = end - overlap;
    if (start < 0) start = 0;
  }

  return chunks.filter((c) => c.length > 0);
}
