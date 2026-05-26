import { createZodDto } from 'nestjs-zod';
import { updateSharedChatSchema } from '../schemas/chat.schema';

export class UpdateSharedChatDto extends createZodDto(updateSharedChatSchema) {}
