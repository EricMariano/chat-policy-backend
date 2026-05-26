import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ServiceData } from '../types/general';
import { DefaultMessageDto } from './dto/default-message.dto';
import { MessageRepository } from './message.repository';
import { MessageResponse } from './message.type';
import { randomUUID } from 'crypto';
import { FindWithPaginationMessageDto } from './dto/find-with-pagination-message.dto';
import { ChatService } from '../chat/chat.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageRepository: MessageRepository,
    private readonly chatService: ChatService,
    private readonly queueService: QueueService
  ) { }

  private buildChatTitle(text: string): string {
    return text.length >= 100 ? text.substring(0, 96).concat('...') : text;
  }

  async createClient(data: ServiceData<CreateMessageDto>): Promise<string> {
    const { userId, bodyData: createMessageDto } = data;

    let chatId = "";
    let messageId = randomUUID();

    await this.prisma.$transaction(async (tx) => {
      if (createMessageDto.chatId) {
        const { isOwner, roleChatId } = await this.chatService.checkPerm({
          ...data,
          bodyData: {
            chatId: createMessageDto.chatId
          }
        });

        if (!isOwner && roleChatId === 2) {
          throw new UnauthorizedException("O seu tipo de permissão não te dar permissão de escrever ")
        }

        chatId = createMessageDto.chatId;

      } else {
        const newChat = await this.chatService.create({
          userId: userId,
          typeUserId: data.typeUserId,
          bodyData: {
            title: this.buildChatTitle(createMessageDto.messageText)
          }
        });

        chatId = newChat.chatId;
      }

      await tx.message.create({
        data: {
          messageId: messageId,
          messageText: createMessageDto.messageText,
          chatId: chatId,
          userId: userId,
          modelIaId: data.bodyData.modelIaId,
          sendAt: new Date(),
          status: "PROCESSING"
        },
        select: {
          messageId: true,
          chatId: true,
          messageText: true,
          userId: true,
          sendAt: true,
          status: true
        },
      });
    });

    console.log(createMessageDto.departmentsIds)
    console.log(createMessageDto.systemsIds)

    await this.queueService.addProcessMessageJob({
      messageId: messageId
    },
    createMessageDto.departmentsIds ? createMessageDto.departmentsIds : [],
    createMessageDto.systemsIds ? createMessageDto.systemsIds : []
    )

    return chatId;

  }

  async checkPerm(data: ServiceData<DefaultMessageDto>): Promise<MessageResponse> {
    const { userId, bodyData } = data;
    const { messageId } = bodyData;

    const message = await this.prisma.message.findUnique({
      where: { messageId },
      select: {
        messageId: true,
        chatId: true,
        messageText: true,
        userId: true,
        sendAt: true,
        modelIaId: true
      },
    });

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    const hasPermission = (await this.messageRepository.findUserWithPermission(userId, message.chatId))?.exists === 1;

    if (!hasPermission) {
      throw new UnauthorizedException('Sem permissão para acessar esta mensagem');
    }

    return message;
  }

  async findMessagesWithPagination(data: ServiceData<FindWithPaginationMessageDto>): Promise<{ data: MessageResponse[], finish: boolean }> {
    const { bodyData } = data;

    await this.chatService.checkPerm(data)

    const limit = Number(process.env.MAX_ITEMS) + 1;
    let finish = true;

    let message
    
    if(bodyData.lastMessageId) {
      message = await this.prisma.message.findUnique({
        where: {
          messageId: bodyData.lastMessageId
        },
        select:{
          sendAt:true
        }
      })
    }

    if(!message && bodyData.lastMessageId) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    const messagens = await this.messageRepository.findMessagesWithPagination(bodyData.chatId, message?.sendAt ?? null, limit);

    if (messagens.length === limit) {
      messagens.pop();
      finish = false;
    }

    return { data: messagens, finish };
  }

}
