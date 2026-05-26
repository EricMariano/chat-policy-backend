import { createZodDto } from 'nestjs-zod';
import { defaultModelIaSchema } from '../schemas/model-ia.schema';

export class DefaultModelIaDto extends createZodDto(defaultModelIaSchema) {}
