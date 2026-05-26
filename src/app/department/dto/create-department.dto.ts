import { createZodDto } from "nestjs-zod";
import { createDepartmentSchema } from "../schemas/department.schema";

export class CreateDepartmentDto extends createZodDto(createDepartmentSchema) {}
