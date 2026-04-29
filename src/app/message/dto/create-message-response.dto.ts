import { ApiProperty } from '@nestjs/swagger';

export class MessageSourceDto {
  @ApiProperty({
    description: 'Titulo do documento que embasa a resposta',
    example: 'Política de Privacidade v2.0',
  })
  documentTitle!: string;

  @ApiProperty({
    description: 'Link publico para a fonte',
    example: 'https://exemplo.com/documentos/politica-privacidade.pdf',
  })
  sourceLink!: string;
}

export class CreateMessageResponseDto {
  @ApiProperty({
    description: 'Resposta gerada pelo modelo, baseada nos trechos recuperados',
    example: 'A politica de reembolso permite...',
  })
  answer!: string;

  @ApiProperty({
    description: 'Fontes deduplicadas por documentId',
    type: [MessageSourceDto],
  })
  sources!: MessageSourceDto[];
}
