import { createZodDto } from 'nestjs-zod';
import { updateModelIaKeySchema } from '../schemas/model-ia-key.schema';

export class UpdateModelIaKeyDto extends createZodDto(updateModelIaKeySchema) {}
