import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SystemResponse } from './system.type.js';

@Injectable()
export class SystemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserWithPermission(userId: number, systemId: number): Promise<{ exists: number }|undefined> { 
    return (await this.prisma.$queryRaw<{ exists: number }>`
        SELECT 
            1 as exists
        FROM 
            tb_permission_group_user pgu
        JOIN tb_permission_group_system pgs 
          ON pgu.permission_group_id = pgs.permission_group_id 
          AND pgs.system_id = ${systemId}
        WHERE 
            pgu.user_id = ${userId}
        LIMIT 1`)[0]
  }

  async findSystemsWithPagination(
    userId: number,
    lastSystemId: number | null,
    limit: number
  ): Promise<SystemResponse[]> {
    const query = `
      SELECT 
          s.system_id AS "systemId",
          s.system_nm AS "systemNm",
          s.active
      FROM 
          tb_system s
      WHERE 
            (${lastSystemId}::int IS NULL OR s.system_id > ${lastSystemId})
          AND s.active = true
          AND EXISTS (
              SELECT 1 
                  FROM tb_permission_group_system pgs
                  INNER JOIN tb_permission_group_user pgu 
                      ON pgs.permission_group_id = pgu.permission_group_id
                  WHERE 
                      pgs.system_id = s.system_id
                      AND pgu.user_id = ${userId}
          )
      ORDER BY 
          s.system_id ASC
      LIMIT ${limit}
    `;

    return this.prisma.$queryRawUnsafe(query);
  }

  async findAllSystems(
    lastSystemId: number | null,
    limit: number
  ): Promise<SystemResponse[]> {
    return this.prisma.$queryRaw`
        SELECT 
            s.system_id AS "systemId",
            s.system_nm AS "systemNm",
            s.active
        FROM 
            tb_system s
        WHERE 
            (${lastSystemId}::int IS NULL OR s.system_id > ${lastSystemId})
            AND s.active = true
        ORDER BY 
            s.system_id ASC
        LIMIT ${limit}
    `;
  }
}
