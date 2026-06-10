import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { MinioService } from '../minio/minio.service';
import { PineconeService } from '../pinecone/pinecone.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let repository: jest.Mocked<Pick<DocumentsRepository, 'findDocumentById'>>;
  let prisma: {
    document: {
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let queue: {
    addProcessDocumentJob: jest.Mock;
  };
  let minioService: {
    uploadFile: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      findDocumentById: jest.fn(),
    };
    prisma = {
      document: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    queue = {
      addProcessDocumentJob: jest.fn(),
    };
    minioService = {
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: QueueService, useValue: queue },
        { provide: MinioService, useValue: minioService },
        { provide: PineconeService, useValue: {} },
        { provide: DocumentsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(DocumentsService);
  });

  it('returns a document detail with versions and linked entity ids', async () => {
    const documentDetail = {
      documentId: '54ca55ee-d34d-4233-91c2-1fdaf7162b77',
      title: 'Politica de seguranca',
      lastUpdateAt: new Date('2026-06-09T10:00:00.000Z'),
      active: true,
      authorName: 'Admin',
      lastVersion: {
        documentVersionId: '56f3fa9c-e595-453e-9c19-545f96888b5f',
        version: '2.0',
        status: 'DONE',
        active: true,
        createdAt: new Date('2026-06-09T09:00:00.000Z'),
      },
      departmentIds: [1, 2],
      systemIds: [3],
    };
    repository.findDocumentById.mockResolvedValue(documentDetail);

    await expect(
      service.findDocumentById('54ca55ee-d34d-4233-91c2-1fdaf7162b77'),
    ).resolves.toEqual(documentDetail);
    expect(repository.findDocumentById).toHaveBeenCalledWith(
      '54ca55ee-d34d-4233-91c2-1fdaf7162b77',
    );
  });

  it('creates the initial version before linking it as the document last version', async () => {
    prisma.document.findFirst.mockResolvedValue(null);

    const tx = {
      document: {
        create: jest.fn().mockResolvedValue({
          documentId: '54ca55ee-d34d-4233-91c2-1fdaf7162b77',
          title: 'Politica de seguranca',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      documentVersion: {
        create: jest.fn().mockResolvedValue({
          documentVersionId: '56f3fa9c-e595-453e-9c19-545f96888b5f',
          version: '1.0',
        }),
      },
    };

    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    minioService.uploadFile.mockResolvedValue(undefined);
    queue.addProcessDocumentJob.mockResolvedValue(undefined);

    await service.createDocument(
      {
        buffer: Buffer.from('policy'),
        mimetype: 'application/pdf',
        originalname: 'policy.pdf',
      },
      {
        userId: 1,
        bodyData: {
          title: 'Politica de seguranca',
          departmentIds: [1],
          systemIds: [2],
        },
      },
    );

    expect(tx.document.create).toHaveBeenCalledWith({
      data: expect.not.objectContaining({
        lastVersionId: expect.any(String),
      }),
    });
    expect(tx.documentVersion.create).toHaveBeenCalled();
    expect(tx.document.update).toHaveBeenCalledWith({
      where: {
        documentId: expect.any(String),
      },
      data: {
        lastVersionId: expect.any(String),
      },
    });
    expect(queue.addProcessDocumentJob).toHaveBeenCalledWith({
      documentVersionId: expect.any(String),
    });
  });
});
