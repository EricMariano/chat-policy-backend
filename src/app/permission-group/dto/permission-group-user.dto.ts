import { createZodDto } from 'nestjs-zod';
import { permissionGroupUserSchema } from '../schemas/permission-group.schema';

export class PermissionGroupUserDto extends createZodDto(
  permissionGroupUserSchema,
) {}
