import { createZodDto } from 'nestjs-zod';
import { defaultPermissionGroupSchema } from '../schemas/permission-group.schema';

export class DefaultPermissionGroupDto extends createZodDto(
  defaultPermissionGroupSchema,
) {}
