import { Injectable, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceData, CheckPermSafe } from '../types/general';
import { DefaultChatDto } from './dto/default-chat.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { ShareChatDto } from './dto/share-chat.dto';
import { UpdateSharedChatDto } from './dto/update-shared-chat.dto';
import { RemoveSharedChatDto } from './dto/remove-shared-chat.dto';
import { FindChatByIdDto } from './dto/find-chat-by-id.dto';
import { FindPermissionsDto } from './dto/find-permissions.dto';
import { randomUUID } from 'crypto';
import { ChatResponse, ChatPermResponse, SharedChatResponse, ChatScrollingResponse, ChatPermissionResponse } from './chat.type';
import { ChatRepository } from './chat.repository';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatRepository: ChatRepository,
  ) {}

  async checkPerm(data: ServiceData<DefaultChatDto>): Promise<ChatPermResponse> {
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
      return { ...chatOwner, isOwner: true, roleChatId: null };
    }

    const sharedChat = await this.prisma.sharedChat.findUnique({
      where: {
        chatId_userId: { chatId, userId },
      },
      select: {
        roleChatId: true,
      },
    });

    if (!sharedChat) {
      throw new UnauthorizedException('Sem permissão para acessar este chat');
    }

    return { ...chatOwner, isOwner: false, roleChatId: sharedChat.roleChatId };
  }

  async checkPermSafe(data: ServiceData<DefaultChatDto>): Promise<CheckPermSafe<ChatPermResponse>> {
    try {
      const result = await this.checkPerm(data);
      return { data: result, ok: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { data: null, ok: false, error: 'NotFoundException' };
      }
      if (error instanceof UnauthorizedException) {
        return { data: null, ok: false, error: 'UnauthorizedException' };
      }
      return { data: null, ok: false, error: 'Erro ao verificar permissão' };
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

  async shareChat(data: ServiceData<ShareChatDto>) {
    const { bodyData } = data;
    const { chatId, targetUserId, roleChatId } = bodyData;

    const {isOwner} = await this.checkPerm(data)
    
    if(!isOwner) {
      throw new UnauthorizedException("Apenas o proprietário do chat pode compartilhar")
    }

    const targetUser = await this.prisma.user.findUnique({ where: { userId: targetUserId } });
    if (!targetUser) throw new NotFoundException('Usuário não encontrado');

    const roleChat = await this.prisma.roleChat.findUnique({ where: { roleChatId } });
    if (!roleChat) throw new NotFoundException('Regra do chat não encontrada');

    const existing = await this.prisma.sharedChat.findUnique({
      where: { chatId_userId: { chatId, userId: targetUserId } },
    });
    if (existing) throw new ConflictException('Chat já compartilhado com este usuário');

    return this.prisma.sharedChat.create({
      data: { chatId, userId: targetUserId, roleChatId },
      select: { chatId: true, userId: true, roleChatId: true,user: true },
    });
  }

  async updateSharedChat(data: ServiceData<UpdateSharedChatDto>) {
    const { bodyData } = data;
    const { chatId, targetUserId, roleChatId } = bodyData;

    const {isOwner} = await this.checkPerm(data)
    
    if(!isOwner) {
      throw new UnauthorizedException("Apenas o proprietário do chat pode editar o compartilhar")
    }

    const roleChat = await this.prisma.roleChat.findUnique({ where: { roleChatId } });
    if (!roleChat) throw new NotFoundException('Role de chat não encontrado');

    const existing = await this.prisma.sharedChat.findUnique({
      where: { chatId_userId: { chatId, userId: targetUserId } },
    });
    if (!existing) throw new NotFoundException('Compartilhamento não encontrado');

    return this.prisma.sharedChat.update({
      where: { chatId_userId: { chatId, userId: targetUserId } },
      data: { roleChatId },
      select: { chatId: true, userId: true, roleChatId: true },
    });
  }

  async removeSharedChat(data: ServiceData<RemoveSharedChatDto>) {
    const { bodyData } = data;
    const { chatId, targetUserId } = bodyData;

    const {isOwner} = await this.checkPerm(data)

    if(!isOwner) {
      throw new UnauthorizedException("Apenas o proprietário do chat pode remover o compartilhamento")
    }

    const existing = await this.prisma.sharedChat.findUnique({
      where: { chatId_userId: { chatId, userId: targetUserId } },
    });
    if (!existing) throw new NotFoundException('Compartilhamento não encontrado');

    await this.prisma.sharedChat.delete({
      where: { chatId_userId: { chatId, userId: targetUserId } },
    });

    return { message: 'Compartilhamento removido com sucesso' };
  }

  async findChatById(data: ServiceData<FindChatByIdDto>): Promise<{data:ChatScrollingResponse[], finished:boolean}> {
    const { userId, bodyData } = data;
    const { lastChatId, limit } = bodyData;

    let finished = true;

    const result = await this.chatRepository.findChatScrolling(userId, lastChatId ?? null, limit+1);

    if(result.length === limit + 1) {
      result.pop();
      finished = false;
    }

    return {
      data: result,
      finished
    };
  }

  async findSharedChatScrolling(data: ServiceData<FindChatByIdDto>): Promise<{data:SharedChatResponse[], finished:boolean}> {
    const { userId, bodyData } = data;
    const { lastChatId, limit } = bodyData;

    const result = await this.chatRepository.findSharedChatScrolling(userId, lastChatId ?? null, limit+1);
    let finished = true;

    if(result.length === limit + 1) {
      result.pop();
      finished = false;
    }

    return {
      data: result,
      finished
    };
  }

  async findPersonHavePermissionChat(data: ServiceData<FindPermissionsDto>): Promise<ChatPermissionResponse[]> {
    const { bodyData } = data;
    const { chatId } = bodyData;

    return await this.chatRepository.findPersonHavePermissionChat(chatId);
  }

}
