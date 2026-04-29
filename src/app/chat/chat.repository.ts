import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChatResponse } from './chat.type.js';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserWithPermission(userId: number, chatId: number): Promise<{ exists: number }|undefined> { 
    return (await this.prisma.$queryRaw<{ exists: number }>`
        SELECT 
            1 as exists
        FROM 
            tb_permission_group_user pgu
        JOIN tb_permission_group_chat pgc 
          ON pgu.permission_group_id = pgc.permission_group_id 
          AND pgc.chat_id = ${chatId}
        WHERE 
            pgu.user_id = ${userId}
        LIMIT 1`)[0]
  }
  
  async findMyChatsWithPagination(
    userId: number,
    lastChatId: string | null,
    limit: number
  ): Promise<ChatResponse[]> {
    const results = await this.prisma.$queryRaw<ChatResponse[]>`
        SELECT 
            c.chat_id,
            c.title,
            rc.role_chat_nm 
        FROM 
            tb_chat c
        INNER JOIN 
            tb_shared_chat tsc ON c.chat_id = tsc.chat_id
        INNER JOIN 
            tb_role_chat rc ON tsc.role_chat_id = rc.role_chat_id
        WHERE 
            (${lastChatId}::int IS NULL OR c.chat_id > ${lastChatId})
            AND tsc.user_id = ${userId}
        ORDER BY 
            c.chat_id ASC
        LIMIT ${limit}
    `;

    return results;
  }
}
