import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document-request.dto';
import { ServiceData } from '../types/general';
import { QueueService } from '../queue/queue.service';
import { MinioService } from '../minio/minio.service';
import { NewVersionDocumentDto } from './dto/new-version-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UpdateDocumentSystemsDto } from './dto/update-document-systems.dto';
import { UpdateDocumentDepartmentsDto } from './dto/update-document-departments.dto';
import { FindDocumentsDto } from './dto/find-documents.dto';
import { FindDocumentVersionsDto } from './dto/find-document-versions.dto';
import { DocumentsRepository } from './documents.repository';
import { PineconeService } from '../pinecone/pinecone.service';

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

function getExtensionFromMimetype(mimetype: string): string {
  const mimeToExt: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  };
  return mimeToExt[mimetype] || '';
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly minioService: MinioService,
    private readonly documentsRepository: DocumentsRepository,
    private readonly pineconeService: PineconeService,
  ) {}

  private generateFileHash(bufferFile: Buffer): string {
    const hash = createHash('sha256');
    hash.update(bufferFile);
    return hash.digest('hex');
  }

  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    const len = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < len; i++) {
      const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  private async updatePineconeDocumentMetadata(
    documentId: string,
    metadata: Record<string, string[]>,
  ): Promise<void> {
    await this.pineconeService.update({
      filter: { documentId: { $eq: documentId } },
      metadata,
    } as Parameters<PineconeService['update']>[0]);
  }

  async createDocument(file: UploadedFile, body: ServiceData<CreateDocumentDto>) {
    const fileHash = this.generateFileHash(file.buffer);
    const documentId = randomUUID();
    const documentVersionId = randomUUID();
    const version = '1.0';

    const fileExtension = getExtensionFromMimetype(file.mimetype);
    const objectName = `documents/${documentId}${fileExtension}`;

    const existDocument = await this.prisma.document.findFirst({
      where: { title: body.bodyData.title }
    });

    if (existDocument) {
      throw new BadRequestException('Document already exists');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const document = await tx.document.create({
        data: {
          documentId,
          title: body.bodyData.title,
          autorId: body.userId,
          active: true,
          lastVersionId: documentVersionId,
          documentSystems: {
            create: body.bodyData.systemIds?.map(systemId => ({ systemId })) || []
          },
          documentDepartments: {
            create: body.bodyData.departmentIds?.map(departmentId => ({ departmentId })) || []
          }
        }
      });

      const documentVersion = await tx.documentVersion.create({
        data: {
          documentVersionId,
          documentId,
          version,
          hash: fileHash,
          documentPath: objectName,
          autorId: body.userId,
          status: 'PROCESSING',
          active: true
        }
      });

      await this.minioService.uploadFile(objectName, file.buffer, file.mimetype);

      await tx.document.update({
        where: { documentId },
        data: { lastVersionId: documentVersionId }
      });

      return { document, documentVersion };
    });

    await this.queue.addProcessDocumentJob({ documentVersionId });

    return result;
  }

  async updateDocument(file: UploadedFile | null, body: ServiceData<UpdateDocumentDto>) {
    const { documentVersionId, title } = body.bodyData;

    // Busca a versão e o documento relacionado
    const documentVersion = await this.prisma.documentVersion.findUnique({
      where: { documentVersionId },
      include: { document: true }
    });

    if (!documentVersion) {
      throw new BadRequestException('Versão do documento não encontrada');
    }

    await this.prisma.$transaction(async (tx) => {
      // Atualiza o título apenas se for diferente do atual
      if (title !== documentVersion.document.title) {
        await tx.document.update({
          where: { documentId: documentVersion.documentId },
          data: { title, lastUpdateAt: new Date() }
        });
      }

      // Se veio arquivo, atualiza o hash e substitui no Minio
      if (file) {
        const newHash = this.generateFileHash(file.buffer);

        if(documentVersion.hash !== newHash) {
          await tx.documentVersion.update({
            where: { documentVersionId },
            data: { hash: newHash }
          });
  
          await this.minioService.uploadFile(
            documentVersion.documentPath,
            file.buffer,
            file.mimetype
          );
  
          // Atualiza lastUpdateAt do documento quando o arquivo é alterado
          await tx.document.update({
            where: { documentId: documentVersion.documentId },
            data: { lastUpdateAt: new Date() }
          });
          // alterar os chunks desse arquivo no pinecone
          await this.queue.addProcessUpdateDocumentJob({ documentVersionId });
          
        }
      }
    });

  }

  async newVersionDocument(file: UploadedFile, body: ServiceData<NewVersionDocumentDto>) {
    const { fileId, version } = body.bodyData;

    const document = await this.prisma.document.findUnique({
      where: { documentId: fileId }
    });

    if (!document) {
      throw new BadRequestException('Documento não existe');
    }

    const existingVersion = await this.prisma.documentVersion.findFirst({
      where: { documentId: fileId, version }
    });

    if (existingVersion) {
      throw new BadRequestException(`Versão: ${version}, já existe nesse documento`);
    }

    const fileHash = this.generateFileHash(file.buffer);
    const documentVersionId = randomUUID();
    const fileExtension = getExtensionFromMimetype(file.mimetype);
    const objectName = `documents/${fileId}${fileExtension}`;

    // Atualiza lastVersionId apenas se a nova versão for maior que a atual
    const isNewerVersion = document.lastVersionId
      ? await this.prisma.documentVersion
          .findUnique({ where: { documentVersionId: document.lastVersionId } })
          .then(last => (last ? this.compareVersions(version, last.version) > 0 : true))
      : true;

    const result = await this.prisma.$transaction(async (tx) => {
      const documentVersion = await tx.documentVersion.create({
        data: {
          documentVersionId,
          documentId: fileId,
          version,
          hash: fileHash,
          documentPath: objectName,
          autorId: body.userId,
          status: 'PROCESSING',
          active: true
        }
      });

      await this.minioService.uploadFile(objectName, file.buffer, file.mimetype);

      if (isNewerVersion) {
        await tx.document.update({
          where: { documentId: fileId },
          data: { lastVersionId: documentVersionId, lastUpdateAt: new Date() }
        });
      }

      return documentVersion;
    });

    await this.queue.addProcessDocumentJob({ documentVersionId });

    return result;
  }

  async updateDocumentSystems(data: ServiceData<UpdateDocumentSystemsDto>) {
    const { documentId, systemIds } = data.bodyData;

    const document = await this.prisma.document.findUnique({ where: { documentId } });
    if (!document) throw new NotFoundException('Documento não encontrado');

    const existing = await this.prisma.documentSystem.findMany({
      where: { documentId },
      select: { systemId: true },
    });

    const existingIds = new Set(existing.map((e) => e.systemId));
    const incomingIds = new Set(systemIds);

    const toAdd = systemIds.filter((id) => !existingIds.has(id));
    const toRemove = [...existingIds].filter((id) => !incomingIds.has(id));

    await this.prisma.$transaction([
      ...(toAdd.length || toRemove.length
        ? [this.prisma.document.update({
            where: { documentId },
            data: { lastUpdateAt: new Date() }
          })]
        : []),
      ...(toAdd.length
        ? [this.prisma.documentSystem.createMany({
            data: toAdd.map((systemId) => ({ documentId, systemId })),
            skipDuplicates: true,
          })]
        : []),
      ...(toRemove.length
        ? [this.prisma.documentSystem.deleteMany({
            where: { documentId, systemId: { in: toRemove } },
          })]
        : []),
    ]);

    if (toAdd.length || toRemove.length) {
      await this.updatePineconeDocumentMetadata(documentId, {
        systemIds: systemIds.map(String),
      });
    }

    return { added: toAdd, removed: toRemove };
  }

  async updateDocumentDepartments(data: ServiceData<UpdateDocumentDepartmentsDto>) {
    const { documentId, departmentIds } = data.bodyData;

    const document = await this.prisma.document.findUnique({ where: { documentId } });
    if (!document) throw new NotFoundException('Documento não encontrado');

    const existing = await this.prisma.documentDepartment.findMany({
      where: { documentId },
      select: { departmentId: true },
    });

    const existingIds = new Set(existing.map((e) => e.departmentId));
    const incomingIds = new Set(departmentIds);

    const toAdd = departmentIds.filter((id) => !existingIds.has(id));
    const toRemove = [...existingIds].filter((id) => !incomingIds.has(id));

    await this.prisma.$transaction([
      ...(toAdd.length || toRemove.length
        ? [this.prisma.document.update({
            where: { documentId },
            data: { lastUpdateAt: new Date() }
          })]
        : []),
      ...(toAdd.length
        ? [this.prisma.documentDepartment.createMany({
            data: toAdd.map((departmentId) => ({ documentId, departmentId })),
            skipDuplicates: true,
          })]
        : []),
      ...(toRemove.length
        ? [this.prisma.documentDepartment.deleteMany({
            where: { documentId, departmentId: { in: toRemove } },
          })]
        : []),
    ]);

    if (toAdd.length || toRemove.length) {
      await this.updatePineconeDocumentMetadata(documentId, {
        departmentIds: departmentIds.map(String),
      });
    }

    return { added: toAdd, removed: toRemove };
  }

  async findDocuments(data: ServiceData<FindDocumentsDto>) {
    const { bodyData } = data;
    const { lastUpdateAt, lastId, limit } = bodyData;

    const lastUpdateAtDate = lastUpdateAt ? new Date(lastUpdateAt) : null;

    const result = await this.documentsRepository.findDocumentsWithPagination(
      lastUpdateAtDate,
      lastId ?? null,
      limit + 1,
    );

    let finished = true;

    if (result.length === limit + 1) {
      result.pop();
      finished = false;
    }

    return {
      data: result,
      finished,
    };
  }

  async findDocumentVersions(data: ServiceData<FindDocumentVersionsDto>) {
    const { bodyData } = data;
    const { documentId, lastCreatedAt, lastId, limit } = bodyData;

    const lastCreatedAtDate = lastCreatedAt ? new Date(lastCreatedAt) : null;

    const result = await this.documentsRepository.findDocumentVersionsWithPagination(
      documentId,
      lastCreatedAtDate,
      lastId ?? null,
      limit + 1,
    );

    let finished = true;

    if (result.length === limit + 1) {
      result.pop();
      finished = false;
    }

    return {
      data: result,
      finished,
    };
  }
}

