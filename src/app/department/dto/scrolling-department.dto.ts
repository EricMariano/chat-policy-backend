import { createZodDto } from 'nestjs-zod';
import {  scrollingDepartmentSchema } from '../schemas/department.schema.js';

export class ScrollingDepartmentDto extends createZodDto(
  scrollingDepartmentSchema
) {}
