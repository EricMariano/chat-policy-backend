import { createZodDto } from 'nestjs-zod';
import { schemaJobDocument } from '../schema/document.schema';

export class DeleteDocumentVersionDto extends createZodDto(
  schemaJobDocument,
) {}
