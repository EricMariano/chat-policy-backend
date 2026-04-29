import { createZodDto } from 'nestjs-zod';
import { defaultChatSchema } from '../schemas/chat.schema.js';

export class DefaultChatDto extends createZodDto(
  defaultChatSchema
) {}
