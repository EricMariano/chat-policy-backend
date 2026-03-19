import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({
    description: 'Pergunta do usuário',
    example: 'Qual é a política para reembolso?',
  })
  question!: string;

  @ApiPropertyOptional({
    description: 'ID da conversa (reservado para histórico futuro)',
    example: 'c9b2a5f1-7a0b-4f7a-9d7c-1234567890ab',
  })
  conversationId?: string;
}
