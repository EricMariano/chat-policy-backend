import { createZodDto } from 'nestjs-zod';
import { createModelIaSchema } from '../schemas/model-ia.schema';

export class CreateModelIaDto extends createZodDto(createModelIaSchema) {}
