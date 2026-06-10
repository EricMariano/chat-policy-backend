import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const findDocumentsSchema = z.object({
  lastUpdateAt: z.string().datetime().nullable().optional(),
  lastId: z.string().uuid().nullable().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export class FindDocumentsDto extends createZodDto(findDocumentsSchema) {}
