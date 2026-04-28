import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { createHmac, timingSafeEqual } from 'node:crypto';

interface TeamsWebhookPayload {
  text?: string;
  conversationId?: string;
  conversation?: {
    id?: string;
  };
}

interface TeamsWebhookResponse {
  type: 'message';
  text: string;
}

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Fazer uma pergunta sobre as políticas' })
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

  @Post('teams-webhook')
  @ApiExcludeEndpoint()
  async handleTeamsWebhook(
    @Headers('authorization') authorization?: string,
    @Body() teamsPayload?: TeamsWebhookPayload,
  ): Promise<TeamsWebhookResponse> {
    const startedAt = Date.now();
    const conversationId = this.extractConversationId(teamsPayload);

    try {
      this.validateTeamsWebhookSignature(authorization, teamsPayload);

      const rawText = teamsPayload?.text ?? '';
      const question = rawText.replace(/<at>.*?<\/at>/g, '').trim();

      if (!question) {
        this.logger.log(
          `[teams-webhook] conversationId=${conversationId} status=empty-question durationMs=${Date.now() - startedAt}`,
        );
        return {
          type: 'message',
          text: 'Olá! Como posso ajudar? Digite sua dúvida sobre as normas da empresa.',
        };
      }

      const aiResponse = await this.chatService.ask(question);
      let finalAnswer = aiResponse.answer;

      if (aiResponse.sources.length > 0) {
        const sourcesText = aiResponse.sources
          .map((source) => `- ${source.documentTitle}: ${source.sourceLink}`)
          .join('\n');
        finalAnswer += `\n\nFontes consultadas:\n${sourcesText}`;
      }

      this.logger.log(
        `[teams-webhook] conversationId=${conversationId} status=ok durationMs=${Date.now() - startedAt}`,
      );
      return {
        type: 'message',
        text: finalAnswer,
      };
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      if (error instanceof UnauthorizedException) {
        this.logger.warn(
          `[teams-webhook] conversationId=${conversationId} status=unauthorized durationMs=${durationMs}`,
        );
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `[teams-webhook] conversationId=${conversationId} status=error durationMs=${durationMs} message="${message}"`,
        stack,
      );
      return {
        type: 'message',
        text: 'Desculpe, ocorreu um erro interno ao consultar as normas. Tente novamente mais tarde.',
      };
    }
  }

  @Get('teams-webhook')
  @ApiExcludeEndpoint()
  getTeamsWebhookStatus(): { status: string; method: string } {
    return {
      status: 'Teams webhook endpoint is online',
      method: 'Use POST to send messages',
    };
  }

  private extractConversationId(
    payload: TeamsWebhookPayload | undefined,
  ): string {
    return payload?.conversationId ?? payload?.conversation?.id ?? 'unknown';
  }

  private validateTeamsWebhookSignature(
    authorization: string | undefined,
    payload: TeamsWebhookPayload | undefined,
  ): void {
    const secretBase64 = process.env.TEAMS_WEBHOOK_HMAC_SECRET;
    if (!secretBase64) {
      return;
    }

    const receivedSignature = authorization?.replace(/^HMAC\s+/i, '').trim();
    if (!receivedSignature) {
      throw new UnauthorizedException('Missing HMAC signature');
    }

    const payloadBody = JSON.stringify(payload ?? {});
    const secret = Buffer.from(secretBase64, 'base64');
    const expectedSignature = createHmac('sha256', secret)
      .update(payloadBody, 'utf8')
      .digest('base64');

    const receivedBuffer = Buffer.from(receivedSignature, 'base64');
    const expectedBuffer = Buffer.from(expectedSignature, 'base64');

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid HMAC signature');
    }
  }
}
