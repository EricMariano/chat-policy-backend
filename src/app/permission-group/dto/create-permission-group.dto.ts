import { createZodDto } from 'nestjs-zod';
import { createPermissionGroupSchema } from '../schemas/permission-group.schema';

export class CreatePermissionGroupDto extends createZodDto(
  createPermissionGroupSchema,
) {}
