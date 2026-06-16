import { createZodDto } from 'nestjs-zod';
import { schemaToggleDocumentVersionActive } from '../schema/document.schema';

export class ToggleDocumentVersionActiveDto extends createZodDto(
  schemaToggleDocumentVersionActive,
) {}
