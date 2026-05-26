import { createZodDto } from 'nestjs-zod';
import { updateModelIaSchema } from '../schemas/model-ia.schema';

export class UpdateModelIaDto extends createZodDto(updateModelIaSchema) {}
