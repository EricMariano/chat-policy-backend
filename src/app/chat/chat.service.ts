import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceData, CheckPermSafe } from '../types/general';
import { DefaultChatDto } from './dto/default-chat.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { randomUUID } from 'crypto';
import { ChatResponse } from './chat.type';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async checkPerm(data: ServiceData<DefaultChatDto>): Promise<any> {
    const { userId, bodyData } = data;
    const { chatId } = bodyData;

    const chatOwner = await this.prisma.chat.findUnique({
      where: { chatId },
      select: {
        chatId: true,
        userId: true,
        title: true,
      },
    });

    if (!chatOwner) {
      throw new NotFoundException('Chat não encontrado');
    }

    if (chatOwner.userId === userId) {
      return chatOwner;
    }

    const sharedChat = await this.prisma.sharedChat.findUnique({
      where: {
        chatId_userId: {
          chatId: chatId,
          userId: userId,
        },
      },
      select: {
        chatId: true,
        userId: true,
        roleChatId: true,
      },
    });

    if (!sharedChat) {
      throw new UnauthorizedException('Sem permissão para acessar este chat');
    }

    return chatOwner;
  }

  async checkPermSafe(data: ServiceData<DefaultChatDto>): Promise<CheckPermSafe<any>> {
    try {
      const result = await this.checkPerm(data);
      return {
        data: result,
        ok: true
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          data: null,
          ok: false,
          error: 'NotFoundException'
        };
      }
      if (error instanceof UnauthorizedException) {
        return {
          data: null,
          ok: false,
          error: 'UnauthorizedException'
        };
      }

      return {
        data: null,
        ok: false,
        error: 'Erro ao verificar permissão'
      };
    }
  }

  async create(data: ServiceData<CreateChatDto>):Promise<ChatResponse> {
    const { userId, bodyData } = data;
    const { title } = bodyData;

    return await this.prisma.chat.create({
      data: {
        chatId: randomUUID(),
        title: title,
        userId: userId,
        createdAt: new Date(),
        lastUpdateAt: new Date(),
      },
      select: {
        chatId: true,
        title: true,
        userId: true,
        createdAt: true,
        lastUpdateAt: true,
      },
    });
  }
}
