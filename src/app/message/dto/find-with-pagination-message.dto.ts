import {createZodDto} from "nestjs-zod"
import { findMessagesWithPaginationSchema } from "../schemas/message.schema";

export class FindWithPaginationMessageDto extends createZodDto(findMessagesWithPaginationSchema) {}