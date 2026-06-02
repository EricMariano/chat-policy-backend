import { createZodDto } from 'nestjs-zod';
import { filterPermissionGroupsSchema } from '../schemas/permission-group.schema';

export class FilterPermissionGroupsDto extends createZodDto(
  filterPermissionGroupsSchema,
) {}
