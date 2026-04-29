import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageResponse, MessageWithModelResponse } from './message.type';

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserWithPermission(userId: number, chatId: string): Promise<{ exists: number } | undefined> {
    return (await this.prisma.$queryRaw<{ exists: number }>`
        SELECT 
            1 as exists
        FROM 
            tb_chat c
        WHERE 
            c.chat_id = ${chatId}
            AND c.user_id = ${userId}
        LIMIT 1`)[0];
  }

  async findMessagesWithPagination(
    chatId: string,
    lastMessageId: string | null,
    limit: number
  ): Promise<MessageWithModelResponse[]> {
    return this.prisma.$queryRaw<MessageWithModelResponse[]>`
        SELECT 
            tm.message_id AS messageId,
            tm.chat_id AS chatId,
            tm.message_text AS messageText,
            tm.send_at AS sendAt,
            tm.user_id AS userId,
            tmi.model_ia_name AS modelIaName
        FROM 
            tb_message tm
        LEFT JOIN
            tb_model_ia tmi ON 
                tm.model_ia_id = tmi.model_ia_id
        WHERE 
            (${chatId}::text IS NULL OR tm.chat_id = ${chatId}) 
            AND (${lastMessageId}::text IS NULL OR tm.send_at < ${lastMessageId})
        ORDER BY tm.send_at DESC LIMIT ${limit};
    `;
  }
}
