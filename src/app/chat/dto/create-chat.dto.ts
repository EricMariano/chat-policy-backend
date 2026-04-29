import { createZodDto } from 'nestjs-zod';
import { createChatSchema } from '../schemas/chat.schema.js';

export class CreateChatDto extends createZodDto(
  createChatSchema
) {}
