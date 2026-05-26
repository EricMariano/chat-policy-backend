import { createZodDto } from 'nestjs-zod';
import { schemaUpdateDocumentSystems } from '../schema/document.schema';

export class UpdateDocumentSystemsDto extends createZodDto(schemaUpdateDocumentSystems) {}
