import { createZodDto } from 'nestjs-zod';
import { schemaJobDocument } from '../schema/document.schema';

export class DownloadDocumentVersionFileDto extends createZodDto(
  schemaJobDocument,
) {}
