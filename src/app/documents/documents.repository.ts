import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DocumentDetailResponse,
  DocumentVersionWithAuthorResponse,
  DocumentWithAuthorResponse,
} from './documents.type';

@Injectable()
export class DocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDocumentsWithPagination(
    lastUpdateAt: Date | null,
    lastId: string | null,
    limit: number
  ): Promise<DocumentWithAuthorResponse[]> {
    return this.prisma.$queryRaw<DocumentWithAuthorResponse[]>`
      SELECT
        d.document_id AS "documentId",
        d.title,
        d.last_update_at AS "lastUpdateAt",
        d.active,
        u.name AS "authorName",
        CASE
          WHEN dv.document_version_id IS NULL THEN NULL
          ELSE json_build_object(
            'documentVersionId', dv.document_version_id,
            'version', dv.version,
            'status', dv.status,
            'active', dv.active,
            'createdAt', dv.created_at
          )
        END AS "lastVersion"
      FROM tb_document d
      INNER JOIN tb_user u ON d.autor_id = u.user_id
      LEFT JOIN tb_document_version dv ON dv.document_version_id = d.last_version_id
      WHERE d.active = true
        AND (
          ${lastUpdateAt}::timestamp IS NULL
          OR
          (d.last_update_at < ${lastUpdateAt}::timestamp)
          OR
          (d.last_update_at = ${lastUpdateAt}::timestamp AND d.document_id < ${lastId}::uuid)
        )
      ORDER BY d.last_update_at DESC, d.document_id DESC
      LIMIT ${limit};
    `;
  }

  async findDocumentById(documentId: string): Promise<DocumentDetailResponse | null> {
    const [document] = await this.prisma.$queryRaw<DocumentDetailResponse[]>`
      SELECT
        d.document_id AS "documentId",
        d.title,
        d.last_update_at AS "lastUpdateAt",
        d.active,
        u.name AS "authorName",
        CASE
          WHEN dv.document_version_id IS NULL THEN NULL
          ELSE json_build_object(
            'documentVersionId', dv.document_version_id,
            'version', dv.version,
            'status', dv.status,
            'active', dv.active,
            'createdAt', dv.created_at
          )
        END AS "lastVersion",
        ARRAY(
          SELECT dd.department_id
          FROM tb_document_department dd
          WHERE dd.document_id = d.document_id
          ORDER BY dd.department_id
        ) AS "departmentIds",
        ARRAY(
          SELECT ds.system_id
          FROM tb_document_system ds
          WHERE ds.document_id = d.document_id
          ORDER BY ds.system_id
        ) AS "systemIds"
      FROM tb_document d
      INNER JOIN tb_user u ON d.autor_id = u.user_id
      LEFT JOIN tb_document_version dv ON dv.document_version_id = d.last_version_id
      WHERE d.document_id = ${documentId}::uuid
        AND d.active = true
      LIMIT 1;
    `;

    return document ?? null;
  }

  async findDocumentVersionsWithPagination(
    documentId: string,
    lastCreatedAt: Date | null,
    lastId: string | null,
    limit: number
  ): Promise<DocumentVersionWithAuthorResponse[]> {
    return this.prisma.$queryRaw<DocumentVersionWithAuthorResponse[]>`
      SELECT
        dv.document_version_id AS "documentVersionId",
        dv.document_id AS "documentId",
        dv.version AS "version",
        dv.document_path AS "documentPath",
        dv.hash AS "hash",
        dv.status AS "status",
        dv.created_at AS "createdAt",
        u.name AS "authorName"
      FROM tb_document_version dv
      INNER JOIN tb_user u ON dv.autor_id = u.user_id
      WHERE dv.document_id = ${documentId}::uuid
        AND (
          ${lastCreatedAt}::timestamp IS NULL
          OR
          (dv.created_at, dv.document_version_id) < (${lastCreatedAt}::timestamp, ${lastId}::uuid)
        )
      ORDER BY dv.created_at DESC, dv.document_version_id DESC
      LIMIT ${limit};
    `;
  }
}
