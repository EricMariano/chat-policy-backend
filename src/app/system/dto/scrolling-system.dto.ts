import { createZodDto } from "nestjs-zod";
import { scrollingSystemSchema } from "../schemas/system.schema";

export class ScrollingSystemDto extends createZodDto(scrollingSystemSchema) {}
