import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageResponse, MessageWithModelResponse } from './message.type';

export interface ModelIaQueueConfig {
  chatModel: string;
  apiKey: string | null;
}

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
    sendAt: Date | null,
    limit: number
  ): Promise<MessageWithModelResponse[]> {
    return this.prisma.$queryRaw<MessageWithModelResponse[]>`
        SELECT
            tm.message_id AS "messageId",
            tm.chat_id AS "chatId",
            tm.message_text AS "messageText",
            tm.send_at AS "sendAt",
            tm.user_id AS "userId",
            tmi.model_nm AS "modelIaName",
            tu.name AS "userName"
        FROM
            tb_message tm
        LEFT JOIN
            tb_model_ia tmi ON
                tm.model_ia_id = tmi.model_ia_id
        LEFT JOIN
            tb_user tu ON
                tm.user_id = tu.user_id
        WHERE
            (${chatId}::text IS NULL OR tm.chat_id = ${chatId})
            AND (${sendAt}::timestamp IS NULL OR tm.send_at < ${sendAt}::timestamp)
        ORDER BY tm.send_at DESC LIMIT ${limit};
    `;
  }

  async findModelIaQueueConfig(
    modelIaId: number,
  ): Promise<ModelIaQueueConfig | undefined> {
    return (await this.prisma.$queryRaw<ModelIaQueueConfig[]>`
      SELECT
        mi.chat_model AS "chatModel",
        mik.model_key AS "apiKey"
      FROM tb_model_ia mi
      LEFT JOIN tb_model_ia_key mik
        ON mik.model_ia_id = mi.model_ia_id
        AND mik.active = true
      WHERE mi.model_ia_id = ${modelIaId}
        AND mi.active = true
      LIMIT 1
    `)[0];
  }
}
