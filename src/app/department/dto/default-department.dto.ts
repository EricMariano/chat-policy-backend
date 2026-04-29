import { createZodDto } from 'nestjs-zod';
import { defaultDepartmentSchema } from '../schemas/department.schema.js';

export class DefaultDepartmentDto extends createZodDto(
  defaultDepartmentSchema
) {}
