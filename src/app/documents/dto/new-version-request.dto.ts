import { ApiProperty } from '@nestjs/swagger';

export class NewVersionRequestDto {
  @ApiProperty({
    description: 'Arquivo para upload (PDF ou .txt)',
    type: 'string',
    format: 'binary',
  })
  file!: any;

  @ApiProperty({
    description: 'ID do documento',
    example: 'c9b2a5f1-7a0b-4f7a-9d7c-1234567890ab',
  })
  fileId!: string;

  @ApiProperty({
    description: 'Versão do documento (ex: 2.0)',
    example: '2.0',
  })
  version!: string;
}
