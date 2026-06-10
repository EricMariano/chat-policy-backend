import {
  Body,
  Controller,
  Post,
  Put,
  Get,
  Query,
  Param,
  ParseUUIDPipe,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { UploadDocumentRequestDto } from './dto/upload-document-request.dto';
import { DocumentsService } from './documents.service';
import { ALLOWED_UPLOAD_MIME_TYPES } from './document-upload.util';
import { CreateDocumentDto } from './dto/create-document-request.dto';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../role';
import { UserRole } from '../user/user.enum';
import { User } from '../user';
import type { JwtPayload } from '../types/jwt';
import { UpdateDocumentSystemsDto } from './dto/update-document-systems.dto';
import { UpdateDocumentDepartmentsDto } from './dto/update-document-departments.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ServiceData } from '../types/general';
import { NewVersionRequestDto } from './dto/new-version-request.dto';
import { FindDocumentsDto } from './dto/find-documents.dto';
import {
  FindDocumentVersionsDto,
  FindDocumentVersionsQueryDto,
} from './dto/find-document-versions.dto';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDocumentRequestDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({
    description: 'Documento indexado a partir do arquivo enviado',
  })
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_UPLOAD_BYTES }),
          new FileTypeValidator({
            fileType: new RegExp(
              `^(${ALLOWED_UPLOAD_MIME_TYPES.map((m) => m.replace(/\//g, '\\/')).join('|')})$`,
            ),
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() body: CreateDocumentDto,
    @User() user:JwtPayload
  ) {
    return await this.documents.createDocument(
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      },
      {
        bodyData:body,
        typeUserId:user.userTypeId,
        userId:user.userId,
      }
    );
  }

  @Post('new-version')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: NewVersionRequestDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cria uma nova versão de um documento existente' })
  @ApiResponse({ status: 200, description: 'Nova versão criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Documento não encontrado ou versão já existe' })
  async newVersion(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_UPLOAD_BYTES }),
          new FileTypeValidator({
            fileType: new RegExp(
              `^(${ALLOWED_UPLOAD_MIME_TYPES.map((m) => m.replace(/\//g, '\\/')).join('|')})$`,
            ),
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() body: NewVersionRequestDto,
    @User() user: JwtPayload
  ) {
    return await this.documents.newVersionDocument(
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      },
      {
        bodyData: body,
        typeUserId: user.userTypeId,
        userId: user.userId,
      }
    );
  }

  @Put()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo opcional para substituir o arquivo da versão',
        },
        documentVersionId: {
          type: 'string',
          format: 'uuid',
          description: 'ID da versão do documento',
        },
        title: {
          type: 'string',
          description: 'Novo título do documento',
        },
      },
      required: ['documentVersionId', 'title'],
    },
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualiza dados de uma versão de documento' })
  @ApiResponse({ status: 200, description: 'Documento atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Versão do documento não encontrada' })
  async updateDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_UPLOAD_BYTES }),
          new FileTypeValidator({
            fileType: new RegExp(
              `^(${ALLOWED_UPLOAD_MIME_TYPES.map((m) => m.replace(/\//g, '\\/')).join('|')})$`,
            ),
          }),
        ],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File | undefined,
    @Body() body: UpdateDocumentDto,
    @User() user: JwtPayload
  ) {
    const serviceData: ServiceData<UpdateDocumentDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };

    return await this.documents.updateDocument(
      file
        ? {
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.originalname,
          }
        : null,
      serviceData,
    );
  }

  @Put('systems')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualiza os sistemas vinculados a um documento (sync)' })
  @ApiBody({ type: UpdateDocumentSystemsDto })
  @ApiResponse({ status: 200, description: 'Sistemas atualizados com sucesso' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  updateSystems(@User() user: JwtPayload, @Body() body: UpdateDocumentSystemsDto) {
    const serviceData: ServiceData<UpdateDocumentSystemsDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };
    return this.documents.updateDocumentSystems(serviceData);
  }

  @Put('departments')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualiza os departamentos vinculados a um documento (sync)' })
  @ApiBody({ type: UpdateDocumentDepartmentsDto })
  @ApiResponse({ status: 200, description: 'Departamentos atualizados com sucesso' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  updateDepartments(@User() user: JwtPayload, @Body() body: UpdateDocumentDepartmentsDto) {
    const serviceData: ServiceData<UpdateDocumentDepartmentsDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };
    return this.documents.updateDocumentDepartments(serviceData);
  }

  @Get()
  @ApiOperation({ summary: 'Listar documentos com paginação' })
  @ApiQuery({ name: 'lastUpdateAt', required: false, description: 'Timestamp da última atualização para cursor-based pagination' })
  @ApiQuery({ name: 'lastId', required: false, description: 'ID do último documento para cursor-based pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados (1-100, padrão: 10)' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiResponse({ status: 200, description: 'Documentos listados com sucesso' })
  async findDocuments(
    @User() user: JwtPayload,
    @Query() query: FindDocumentsDto,
  ) {
    const serviceData: ServiceData<FindDocumentsDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: query,
    };
    return this.documents.findDocuments(serviceData);
  }

  @Get(':documentId')
  @ApiOperation({ summary: 'Buscar detalhes de um documento' })
  @ApiParam({ name: 'documentId', description: 'ID do documento (UUID)' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiResponse({ status: 200, description: 'Documento encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  async findDocumentById(@Param('documentId', ParseUUIDPipe) documentId: string) {
    return this.documents.findDocumentById(documentId);
  }

  @Get(':documentId/versions')
  @ApiOperation({ summary: 'Listar versões de um documento com paginação' })
  @ApiParam({ name: 'documentId', description: 'ID do documento (UUID)' })
  @ApiQuery({ name: 'lastCreatedAt', required: false, description: 'Timestamp da última versão para cursor-based pagination' })
  @ApiQuery({ name: 'lastId', required: false, description: 'ID da última versão para cursor-based pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados (1-100, padrão: 10)' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiResponse({ status: 200, description: 'Versões listadas com sucesso' })
  async findDocumentVersions(
    @User() user: JwtPayload,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Query() query: FindDocumentVersionsQueryDto,
  ) {
    const serviceData: ServiceData<FindDocumentVersionsDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: { ...query, documentId },
    };
    return this.documents.findDocumentVersions(serviceData);
  }
}
