import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOkResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import type { UploadDocumentDto } from './dto/upload-document.dto';
import { UploadDocumentRequestDto } from './dto/upload-document-request.dto';
import { DocumentsService } from './documents.service';
import { ALLOWED_UPLOAD_MIME_TYPES } from './document-upload.util';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post()
  async create(@Body() dto: CreateDocumentDto) {
    return this.documents.createDocument(dto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDocumentRequestDto })
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
    @Body() body: UploadDocumentDto,
  ) {
    return this.documents.createDocumentFromFile(
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      },
      body,
    );
  }
}
