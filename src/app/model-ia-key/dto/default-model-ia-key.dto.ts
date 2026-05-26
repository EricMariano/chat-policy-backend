import { createZodDto } from 'nestjs-zod';
import { defaultModelIaKeySchema } from '../schemas/model-ia-key.schema';

export class DefaultModelIaKeyDto extends createZodDto(defaultModelIaKeySchema) {}
