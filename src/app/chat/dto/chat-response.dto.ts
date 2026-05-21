// src/app/chat/dto/chat-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ChatSourceDto {
  @ApiProperty()
  documentTitle: string;

  @ApiProperty()
  sourceLink: string;
}

export class ChatResponseDto {
  @ApiProperty()
  answer: string;

  @ApiProperty({ type: [ChatSourceDto] })
  sources: ChatSourceDto[];
}