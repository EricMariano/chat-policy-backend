import { createZodDto } from 'nestjs-zod';
import { createModelIaKeySchema } from '../schemas/model-ia-key.schema';

export class CreateModelIaKeyDto extends createZodDto(createModelIaKeySchema) {}
