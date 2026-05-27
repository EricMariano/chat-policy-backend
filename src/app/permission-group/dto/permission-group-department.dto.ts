import { createZodDto } from 'nestjs-zod';
import { permissionGroupDepartmentSchema } from '../schemas/permission-group.schema';

export class PermissionGroupDepartmentDto extends createZodDto(
  permissionGroupDepartmentSchema,
) {}
