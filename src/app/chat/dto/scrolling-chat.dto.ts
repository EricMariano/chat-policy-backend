import { createZodDto } from 'nestjs-zod';
import { scrollingChatSchema } from '../schemas/chat.schema.js';

export class ScrollingChatDto extends createZodDto(
  scrollingChatSchema
) {}
