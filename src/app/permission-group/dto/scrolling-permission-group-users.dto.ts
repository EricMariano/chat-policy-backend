import { createZodDto } from 'nestjs-zod';
import { scrollingPermissionGroupUsersSchema } from '../schemas/permission-group.schema';

export class ScrollingPermissionGroupUsersDto extends createZodDto(
  scrollingPermissionGroupUsersSchema,
) {}
