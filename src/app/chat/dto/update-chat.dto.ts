import { createZodDto } from 'nestjs-zod';
import { updateChatSchema } from '../schemas/chat.schema.js';

export class UpdateChatDto extends createZodDto(
  updateChatSchema
) {}
