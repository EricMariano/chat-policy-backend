import { schemaCreateDocument } from './schema/document.schema';
import { findDocumentsSchema } from './dto/find-documents.dto';
import {
  findDocumentVersionsQuerySchema,
  findDocumentVersionsSchema,
} from './dto/find-document-versions.dto';

describe('document schemas', () => {
  it('coerces pagination query limits from strings', () => {
    expect(findDocumentsSchema.parse({ limit: '25' }).limit).toBe(25);
    expect(
      findDocumentVersionsSchema.parse({
        documentId: '54ca55ee-d34d-4233-91c2-1fdaf7162b77',
        limit: '10',
      }).limit,
    ).toBe(10);
    expect(findDocumentVersionsQuerySchema.parse({ limit: '10' }).limit).toBe(10);
  });

  it('normalizes single multipart link ids to arrays', () => {
    const parsed = schemaCreateDocument.parse({
      title: 'Politica de seguranca',
      departmentIds: '1',
      systemIds: '2',
    });

    expect(parsed.departmentIds).toEqual([1]);
    expect(parsed.systemIds).toEqual([2]);
  });
});
