import { createZodDto } from "nestjs-zod";
import { createMessageSchema } from "../schemas/message.schema";

export class CreateMessageDto extends createZodDto(createMessageSchema) {}
