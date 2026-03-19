import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiBody({ type: ChatRequestDto })
  @ApiOkResponse({ type: ChatResponseDto })
  async chat(@Body() body?: ChatRequestDto): Promise<ChatResponseDto> {
    const question = body?.question;
    if (!question || typeof question !== 'string' || !question.trim()) {
      throw new BadRequestException(
        'question is required and must be non-empty',
      );
    }
    return this.chatService.ask(question.trim());
  }
}
