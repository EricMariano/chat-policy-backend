import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const findDocumentByIdSchema = z.object({
  documentId: z.string().uuid('ID do documento deve ser um UUID válido'),
});

export class FindDocumentByIdDto extends createZodDto(findDocumentByIdSchema) {}
