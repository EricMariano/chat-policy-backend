import { createZodDto } from 'nestjs-zod';
import {  updateUserSchema } from '../schemas/user.schema';

export class UpdateUserDto extends createZodDto(
  updateUserSchema,
) {}
