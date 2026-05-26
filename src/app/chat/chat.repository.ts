import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChatResponse, SharedChatResponse, ChatScrollingResponse, ChatPermissionResponse } from './chat.type.js';

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
  
  async findSharedChatScrolling(
    userId: number,
    lastChatId: string | null,
    limit: number
  ): Promise<SharedChatResponse[]> {
    const results = await this.prisma.$queryRaw<SharedChatResponse[]>`
        SELECT 
            c.chat_id AS "chatId",
            c.title,
            rc.role_chat_nm AS "roleChatNm",
            tu."name" as "owner",
            c.last_update_at as "lastUpdateAt"
        FROM 
            tb_chat c
        INNER JOIN 
            tb_shared_chat tsc ON c.chat_id = tsc.chat_id
        INNER JOIN 
            tb_role_chat rc ON tsc.role_chat_id = rc.role_chat_id
     	inner join
     		tb_user tu on tu.user_id = c.user_id
        WHERE 
            (${lastChatId}::uuid IS NULL OR c.chat_id > ${lastChatId}::uuid)
            AND tsc.user_id = ${userId}
        ORDER BY 
            c.chat_id ASC
        LIMIT ${limit}
    `;

    return results;
  }

  async findChatScrolling(userId: number,lastChatId:string|null,limit:number): Promise<ChatScrollingResponse[]> {
    const result = await this.prisma.$queryRaw<ChatScrollingResponse[]>`
       SELECT 
            chat_id AS "chatId",
            title,
            user_id AS "userId",
            created_at AS "createdAt",
            last_update_at AS "lastUpdateAt"
        FROM 
            tb_chat
        WHERE 
            user_id = ${userId}
            AND (
                ${lastChatId}::uuid IS NULL
                OR last_update_at < (SELECT last_update_at FROM tb_chat WHERE chat_id = ${lastChatId}::uuid)
                OR (
                    last_update_at = (SELECT last_update_at FROM tb_chat WHERE chat_id = ${lastChatId}::uuid)
                    AND chat_id < ${lastChatId}::uuid
                )
            )
        ORDER BY
            last_update_at DESC,
            chat_id DESC
        LIMIT ${limit};
    `;

    return result || []

  }

  async findPersonHavePermissionChat (chatId: string): Promise<ChatPermissionResponse[]> {
    const result = await this.prisma.$queryRaw<ChatPermissionResponse[]>`
        SELECT
            u.name AS "userNm",
            r.role_chat_nm AS "typeAccess",
            u.user_id AS "userId",
            u.email,
            r.role_chat_id AS "roleChatId"
        FROM tb_shared_chat sc
        INNER JOIN tb_user u ON sc.user_id = u.user_id
        INNER JOIN tb_role_chat r ON sc.role_chat_id = r.role_chat_id
        WHERE sc.chat_id = ${chatId}::uuid;
    `;
    return result;
  }


}
