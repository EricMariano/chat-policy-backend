import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const findDocumentVersionsSchema = z.object({
  documentId: z.string().uuid(),
  lastCreatedAt: z.string().datetime().nullable().optional(),
  lastId: z.string().uuid().nullable().optional(),
  limit: z.number().min(1).max(100).default(10),
});

export class FindDocumentVersionsDto extends createZodDto(findDocumentVersionsSchema) {}
