import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const findDocumentVersionsSchema = z.object({
  documentId: z.string().uuid(),
  lastCreatedAt: z.string().datetime().nullable().optional(),
  lastId: z.string().uuid().nullable().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const findDocumentVersionsQuerySchema = findDocumentVersionsSchema.omit({
  documentId: true,
});

export class FindDocumentVersionsDto extends createZodDto(findDocumentVersionsSchema) {}

export class FindDocumentVersionsQueryDto extends createZodDto(
  findDocumentVersionsQuerySchema,
) {}
