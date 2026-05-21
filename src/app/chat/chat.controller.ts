import { Controller, Post, Body, BadRequestException, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { TeamsAuthGuard } from './chat.teams-auth.guard';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  private readonly processingRequests = new Map<string, Promise<any>>();
  private readonly MAX_CACHE_SIZE = 1000;

  @Post()
  @ApiOperation({ summary: 'Fazer uma pergunta sobre as políticas (Padrão)' })
  @ApiBody({ type: () => ChatRequestDto })
  @ApiOkResponse({ type: () => ChatResponseDto })
  async chat(@Body() body: ChatRequestDto): Promise<ChatResponseDto> {
    if (!body.question || body.question.trim() === '') {
      throw new BadRequestException('question is required and must be non-empty');
    }
    return this.chatService.ask(body.question.trim());
  }

  @UseGuards(TeamsAuthGuard)
  @Post('teams-webhook')
  @ApiOperation({ summary: 'Receber mensagens do Webhook do Microsoft Teams' })
  async handleTeamsWebhook(@Body() teamsPayload: any, @Res() res: Response) {
    if (teamsPayload?.from?.role === 'bot') {
      return res.status(200).end();
    }

    let question = teamsPayload?.text || '';
    question = question
      .replace(/<at>.*?<\/at>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const messageId = teamsPayload?.id;

    if (!question) {
      return res.status(200).json({
        type: 'message',
        text: '👋 Olá! Digite sua dúvida sobre as normas da empresa.',
      });
    }

    if (this.processingRequests.has(messageId)) {
      await this.processingRequests.get(messageId);
      return res.status(200).end();
    }

    const processingPromise = (async () => {
      try {
        const aiResponse = await this.chatService.ask(question);

        const bodyBlocks: any[] = [
          { type: 'TextBlock', text: '📋 Resposta', weight: 'Bolder', size: 'Medium' },
          { type: 'TextBlock', text: aiResponse.answer, wrap: true },
        ];

        if (aiResponse.sources?.length > 0) {
          bodyBlocks.push({
            type: 'TextBlock',
            text: '🔗 Fontes Consultadas',
            weight: 'Bolder',
            separator: true,
            spacing: 'Medium',
          });
          aiResponse.sources.forEach((source) => {
            bodyBlocks.push({
              type: 'TextBlock',
              text: `• [${source.documentTitle}](${source.sourceLink})`,
              wrap: true,
            });
          });
        }

        return {
          type: 'message',
          attachments: [{
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: { type: 'AdaptiveCard', version: '1.4', body: bodyBlocks },
          }],
        };

      } catch (error) {
        console.error('Erro no Teams Webhook:', error);
        return {
          type: 'message',
          text: '❌ Ocorreu um erro interno. Tente novamente mais tarde.',
        };
      }
    })();

    if (this.processingRequests.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.processingRequests.keys().next().value;
      if (firstKey !== undefined) {
        this.processingRequests.delete(firstKey);
      }
    }

    this.processingRequests.set(messageId, processingPromise);

    try {
      const response = await processingPromise;
      return res.status(200).json(response);
    } finally {
      setTimeout(() => {
        this.processingRequests.delete(messageId);
      }, 2000);
    }
  }
}