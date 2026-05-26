import { createZodDto } from "nestjs-zod";
import { createSystemSchema } from "../schemas/system.schema";

export class CreateSystemDto extends createZodDto(createSystemSchema) {}
