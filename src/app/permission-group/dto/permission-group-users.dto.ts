import { createZodDto } from 'nestjs-zod';
import { permissionGroupUsersSchema } from '../schemas/permission-group.schema';

export class PermissionGroupUsersDto extends createZodDto(
  permissionGroupUsersSchema,
) {}
