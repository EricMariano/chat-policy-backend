import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const filterUsersSchema = z.object({
  active: z.boolean().optional(),
  name: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
  currentPage:z.number().min(1,"currentPage invalida").default(1)
});

export class FilterUsersDto extends createZodDto(filterUsersSchema) {}
