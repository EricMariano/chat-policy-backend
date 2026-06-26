import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ActivityTypes,
  BotFrameworkAdapter,
  ConversationReference,
  TeamsInfo,
  TurnContext,
} from 'botbuilder';
import { Request, Response } from 'express';
import { MessageService } from '../message/message.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface ChatResponsePayload {
  chatId?: string;
  originalMessageId?: string;
  messageId?: string;
  messageText?: string;
  answer?: string;
  response?: string;
  error?: string;
  status?: string;
}

interface TeamsUser {
  userId: number;
  typeUserId: number;
}

interface TeamsMessageResult {
  chatId: string;
  messageId: string;
}

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);
  private readonly adapter: BotFrameworkAdapter;
  private readonly defaultModelIaId: number;
  private readonly conversationTtlSeconds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly messageService: MessageService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    this.defaultModelIaId = this.getPositiveNumberConfig(
      'TEAMS_BOT_DEFAULT_MODEL_IA_ID',
      1,
    );
    this.conversationTtlSeconds = this.getPositiveNumberConfig(
      'TEAMS_BOT_CONVERSATION_TTL_SECONDS',
      86400,
    );

    const microsoftAppTenantId = this.getRequiredStringConfig(
      'MICROSOFT_APP_TENANT_ID',
    );

    this.adapter = new BotFrameworkAdapter({
      appId: this.configService.get<string>('MICROSOFT_APP_ID') ?? '',
      appPassword: this.configService.get<string>('MICROSOFT_APP_PASSWORD') ?? '',
      channelAuthTenant: microsoftAppTenantId,
    });

    this.adapter.onTurnError = async (context, error) => {
      this.logger.error('Erro ao processar atividade do Teams', error);
      await context.sendActivity(
        'Não foi possível processar sua mensagem no momento.',
      );
    };
  }

  async onModuleInit(): Promise<void> {
    await this.redisService.subscribe('chat_response', async (message) => {
      await this.handleChatResponse(message);
    });
  }

  async processActivity(request: Request, response: Response): Promise<void> {
    try {
      await this.adapter.processActivity(
        request as any,
        response as any,
        async (context) => {
          try {
            await this.handleTurn(context);
          } catch (error) {
            // this.logger.error(
            //   `Erro ao processar mensagem do Teams: ${(error as Error).message}`,
            //   error instanceof Error ? error.stack : '',
            // );
            await context.sendActivity(this.buildUserErrorMessage(error));
          }
        },
      );
    } catch (error) {
      this.logger.error(
        `Erro ao processar mensagem do Teams: ${(error as Error).message}`,
        error instanceof Error ? error.stack : '',
      );
    }
  }

  private async handleTurn(context: TurnContext): Promise<void> {
    if (context.activity.type !== ActivityTypes.Message) {
      return;
    }

    const messageText = context.activity.text?.trim();
    if (!messageText) {
      await context.sendActivity('Envie uma mensagem de texto para continuar.');
      return;
    }

    this.logger.log('context', context);

    const email = (await this.resolveTeamsUserEmail(context))??"almeidaadson5@gmail.com";
    if (!email) {
      await context.sendActivity(
        'Não consegui identificar seu e-mail no Microsoft Teams.',
      );
      return;
    }

    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        active: true,
      },
      select: {
        userId: true,
        typeUserId: true,
      },
    });

    if (!user) {
      await context.sendActivity(
        'Seu usuário não foi encontrado ou está inativo na aplicação.',
      );
      return;
    }

    const userChatKey = this.buildUserChatKey(user.userId);
    const cachedChatId = await this.redisService.get<string>(userChatKey);
    const { chatId, messageId } = await this.createTeamsMessage(
      user,
      messageText,
      cachedChatId,
      userChatKey,
    );

    await this.redisService.set(userChatKey, chatId);

    const conversationReference = TurnContext.getConversationReference(
      context.activity,
    );

    await Promise.all([
      this.saveConversationReference(`message:${messageId}`, conversationReference),
      this.saveConversationReference(`chat:${chatId}`, conversationReference),
    ]);

    await context.sendActivity(
      'Mensagem recebida. Vou responder por aqui quando o processamento terminar.',
    );
  }

  private async createTeamsMessage(
    user: TeamsUser,
    messageText: string,
    cachedChatId: string | null,
    userChatKey: string,
  ): Promise<TeamsMessageResult> {
    try {
      return await this.createTeamsMessageWithChatId(
        user,
        messageText,
        cachedChatId ?? undefined,
      );
    } catch (error) {
      if (!cachedChatId || !this.isInvalidCachedChatError(error)) {
        throw error;
      }

      await this.redisService.delete(userChatKey);
      return this.createTeamsMessageWithChatId(user, messageText);
    }
  }

  private async createTeamsMessageWithChatId(
    user: TeamsUser,
    messageText: string,
    chatId?: string,
  ): Promise<TeamsMessageResult> {
    return this.messageService.createClientWithMetadata({
      userId: user.userId,
      typeUserId: user.typeUserId,
      bodyData: {
        chatId,
        messageText,
        modelIaId: this.defaultModelIaId,
        departmentsIds: [],
        systemsIds: [],
      },
    });
  }

  private async resolveTeamsUserEmail(
    context: TurnContext,
  ): Promise<string | null> {
    const candidates = new Set<string>();
    const addEmailCandidate = (value?: string | null) => {
      const email = value?.trim();
      if (email?.includes('@')) {
        candidates.add(email);
      }
    };

    try {
      const member = await TeamsInfo.getMember(context, context.activity.from.id);
      addEmailCandidate(member.email);
      addEmailCandidate(member.userPrincipalName);
      addEmailCandidate((member as { upn?: string }).upn);
    } catch (error) {
      this.logger.warn(
        `Não foi possível buscar membro do Teams: ${(error as Error).message}`,
      );
    }

    addEmailCandidate(
      (context.activity.from as { email?: string; userPrincipalName?: string })
        .email,
    );
    addEmailCandidate(
      (context.activity.from as { email?: string; userPrincipalName?: string })
        .userPrincipalName,
    );

    return candidates.values().next().value ?? null;
  }

  private async handleChatResponse(message: string): Promise<void> {
    try {
      const payload = JSON.parse(message) as ChatResponsePayload;
      if (payload.status === 'PROCESSING') {
        return;
      }

      const conversationReference = await this.getConversationReference(payload);
      if (!conversationReference) {
        return;
      }

      const responseText = this.buildTeamsResponse(payload);
      await this.adapter.continueConversation(conversationReference, async (context) => {
        await context.sendActivity(responseText);
      });
    } catch (error) {
      this.logger.error(
        `Erro ao enviar resposta proativa para o Teams: ${(error as Error).message}`,
      );
    }
  }

  private async getConversationReference(
    payload: ChatResponsePayload,
  ): Promise<Partial<ConversationReference> | null> {
    const referenceMessageId = payload.originalMessageId ?? payload.messageId;

    if (referenceMessageId) {
      const reference = await this.redisService.get<Partial<ConversationReference>>(
        this.buildReferenceKey(`message:${referenceMessageId}`),
      );
      if (reference) return reference;
    }

    if (payload.chatId) {
      return this.redisService.get<Partial<ConversationReference>>(
        this.buildReferenceKey(`chat:${payload.chatId}`),
      );
    }

    return null;
  }

  private buildTeamsResponse(payload: ChatResponsePayload): string {
    if (payload.status === 'ERROR') {
      return payload.error ?? 'Ocorreu um erro ao processar sua mensagem.';
    }

    return (
      payload.answer ??
      payload.response ??
      payload.messageText ??
      payload.error ??
      'Processamento concluído.'
    );
  }

  private buildUserErrorMessage(error: unknown): string {
    if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
      const response = error.getResponse();
      if (typeof response === 'string') {
        return response;
      }

      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const message = (response as { message: string | string[] }).message;
        return Array.isArray(message) ? message.join('\n') : message;
      }
    }

    return 'Não foi possível processar sua mensagem no momento. Tente novamente mais tarde.';
  }

  private async saveConversationReference(
    id: string,
    conversationReference: Partial<ConversationReference>,
  ): Promise<void> {
    await this.redisService.set(
      this.buildReferenceKey(id),
      conversationReference,
      this.conversationTtlSeconds,
    );
  }

  private buildReferenceKey(id: string): string {
    return `teams:conversation:${id}`;
  }

  private buildUserChatKey(userId: number): string {
    return `teams:user-chat:${userId}`;
  }

  private isInvalidCachedChatError(error: unknown): boolean {
    return error instanceof NotFoundException || error instanceof UnauthorizedException;
  }

  private getPositiveNumberConfig(key: string, defaultValue: number): number {
    const value = Number(this.configService.get<string>(key));
    return Number.isFinite(value) && value > 0 ? value : defaultValue;
  }

  private getRequiredStringConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) {
      throw new Error(`${key} must be configured`);
    }

    return value;
  }
}
