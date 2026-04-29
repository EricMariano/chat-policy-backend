import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOkResponse } from '@nestjs/swagger';
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
}
