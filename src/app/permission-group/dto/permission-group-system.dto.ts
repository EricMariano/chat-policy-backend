import { createZodDto } from 'nestjs-zod';
import { permissionGroupSystemSchema } from '../schemas/permission-group.schema';

export class PermissionGroupSystemDto extends createZodDto(
  permissionGroupSystemSchema,
) {}
