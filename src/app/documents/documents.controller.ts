import {
  Body,
  Controller,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import type { UploadDocumentDto } from './dto/upload-document.dto';
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
import { ServiceData } from '../types/general';
import { NewVersionRequestDto } from './dto/new-version-request.dto';

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
    return this.documents.createDocument(
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
    return this.documents.newVersionDocument(
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
}
