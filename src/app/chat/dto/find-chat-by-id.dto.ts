import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const findChatByIdSchema = z.object({
  lastChatId: z.string().nullable().optional(),
  limit: z.number().min(1).max(100).default(10),
});

export class FindChatByIdDto extends createZodDto(findChatByIdSchema) {}
