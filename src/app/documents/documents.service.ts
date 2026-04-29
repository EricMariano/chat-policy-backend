import { Injectable } from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document-request.dto';
import { ServiceData } from '../types/general';
import { createPath, saveFile } from './document.util';
import { QueueService } from '../queue/queue.service';

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService
  ) {}

  private generateFileHash(bufferFile: Buffer): string {
    const hash = createHash('sha256');
    hash.update(bufferFile);
    return hash.digest('hex');
  }

  async createDocument (file: UploadedFile, body:ServiceData<CreateDocumentDto>) {
    const fileHash = this.generateFileHash(file.buffer);
    const documentId = randomUUID();
    const documentVersionId = randomUUID();
    const version = "1.0";

    const documentPath = createPath(
      documentId,
      file.originalname,
      file.mimetype
    );

    const existDocument = await this.prisma.document.findFirst({
      where: {
        title: body.bodyData.title
      }
    });

    if (existDocument) {
      throw new Error('Document already exists');
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
            create: body.bodyData.systemIds?.map(systemId => ({
              systemId
            })) || []
          },
          documentDepartments: {
            create: body.bodyData.departmentIds?.map(departmentId => ({
              departmentId
            })) || []
          }
        }
      });

      const documentVersion = await tx.documentVersion.create({
        data: {
          documentVersionId,
          documentId,
          version,
          hash: fileHash,
          documentPath,
          autorId: body.userId,
          status:"PROCESSING",
          active: true
        }
      });

      await saveFile(documentPath, file.buffer);

      await tx.document.update({
        where: {
          documentId
        },
        data: {
          lastVersionId: documentVersionId
        }
      });

      return { document, documentVersion };
    });

    await this.queue.addProcessDocumentJob({
      documentVersionId: documentVersionId
    });

    return result;
  }
}
