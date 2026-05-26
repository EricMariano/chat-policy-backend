import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const findUserByEmailSchema = z.object({
  email: z.string("Email é obrigatório"),
});

export class FindUserByEmailDto extends createZodDto(findUserByEmailSchema) {}
