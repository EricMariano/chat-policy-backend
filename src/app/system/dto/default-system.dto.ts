import { createZodDto } from "nestjs-zod";
import { defaultSystemSchema } from "../schemas/system.schema";

export class DefaultSystemDto extends createZodDto(defaultSystemSchema) {}
