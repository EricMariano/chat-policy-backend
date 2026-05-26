import { createZodDto } from 'nestjs-zod';
import { removeSharedChatSchema } from '../schemas/chat.schema';

export class RemoveSharedChatDto extends createZodDto(removeSharedChatSchema) {}
