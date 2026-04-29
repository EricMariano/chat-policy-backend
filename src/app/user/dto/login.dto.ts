import { createZodDto } from 'nestjs-zod';
import { loginUserSchema } from '../schemas/user.schema';

export class LoginUserDto extends createZodDto(
  loginUserSchema,
) {}
