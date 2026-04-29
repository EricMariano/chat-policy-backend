import { createZodDto } from 'nestjs-zod';
import { updateDepartmentSchema } from '../schemas/department.schema.js';

export class UpdateDepartmentDto extends createZodDto(
  updateDepartmentSchema
) {}
