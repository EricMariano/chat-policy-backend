import { createZodDto } from 'nestjs-zod';
import { filterPermissionGroupAccessSchema } from '../schemas/permission-group.schema';

export class FilterPermissionGroupAccessDto extends createZodDto(
  filterPermissionGroupAccessSchema,
) {}
