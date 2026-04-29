import { createZodDto } from "nestjs-zod";
import { defaultMessageSchema } from "../schemas/message.schema";

export class DefaultMessageDto extends createZodDto(defaultMessageSchema) {}
