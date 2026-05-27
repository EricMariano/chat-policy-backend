import { createZodDto } from 'nestjs-zod';
import { updatePermissionGroupSchema } from '../schemas/permission-group.schema';

export class UpdatePermissionGroupDto extends createZodDto(
  updatePermissionGroupSchema,
) {}
