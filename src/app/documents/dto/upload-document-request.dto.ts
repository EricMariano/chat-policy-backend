import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDocumentRequestDto {
  @ApiProperty({
    description: 'Arquivo para upload (PDF ou .txt)',
    type: 'string',
    format: 'binary',
  })
  file!: any;

  @ApiProperty({
    description: 'Título do documento',
    example: 'Política de Privacidade v2.0',
  })
  title!: string;

  @ApiProperty({
    description:
      'Link público do documento (será usado como sourceLink no chat)',
    example: 'https://exemplo.com/documentos/politica-privacidade.pdf',
  })
  sourceLink!: string;

  @ApiPropertyOptional({
    description: 'ID do usuário (opcional)',
    example: 'c9b2a5f1-7a0b-4f7a-9d7c-1234567890ab',
  })
  createdById?: string;
}
