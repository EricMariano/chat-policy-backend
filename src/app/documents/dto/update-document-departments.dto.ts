import { createZodDto } from 'nestjs-zod';
import { schemaUpdateDocumentDepartments } from '../schema/document.schema';

export class UpdateDocumentDepartmentsDto extends createZodDto(schemaUpdateDocumentDepartments) {}
