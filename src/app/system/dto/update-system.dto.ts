import { createZodDto } from "nestjs-zod";
import { updateSystemSchema } from "../schemas/system.schema";

export class UpdateSystemDto extends createZodDto(updateSystemSchema) {}
