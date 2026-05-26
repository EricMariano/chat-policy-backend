import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const findPermissionsSchema = z.object({
  chatId: z.string("id do chat é obrigatório")
  .uuid("id do chat deve ser um uuid válido"),
});

export class FindPermissionsDto extends createZodDto(findPermissionsSchema) {}
