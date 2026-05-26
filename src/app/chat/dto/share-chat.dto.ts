import { createZodDto } from 'nestjs-zod';
import { sharechatSchema } from '../schemas/chat.schema';

export class ShareChatDto extends createZodDto(sharechatSchema) {}
