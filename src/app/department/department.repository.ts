import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DepartmentResponse } from './department.type';

@Injectable()
export class DepartmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserWithPermission(userId: number, departmentId: number): Promise<{ exists: number }|undefined> { 
    return (await this.prisma.$queryRaw<{ exists: number }>`
        SELECT 
            1 as exists
        FROM 
            tb_permission_group_user pgu
        JOIN tb_permission_group_department pgd 
          ON pgu.permission_group_id = pgd.permission_group_id 
          AND pgd.department_id = ${departmentId}
        WHERE 
            pgu.user_id = ${userId}
        LIMIT 1`)[0]
  }

  async findDepartmentsWithPagination(
    userId: number,
    lastDepartmentId: number | null,
    limit: number
  ): Promise<DepartmentResponse[]> {
    const query = `
      SELECT 
          d.department_id as departmentId,
          d.department_nm as departmentNm,
          d.acronym,
          d.active
      FROM 
          tb_department d
      WHERE 
          (${lastDepartmentId}::int IS NULL OR d.department_id > ${lastDepartmentId})
          AND d.active = true
          AND EXISTS (
              SELECT 1 
                  FROM tb_permission_group_department pgd
                  INNER JOIN tb_permission_group_user pgu 
                      ON pgd.permission_group_id = pgu.permission_group_id
                  WHERE 
                      pgd.department_id = d.department_id
                      AND pgu.user_id = ${userId}
          )
      ORDER BY 
          d.department_id ASC
      LIMIT ${limit}
    `;

    const results = await this.prisma.$queryRawUnsafe<DepartmentResponse[]>(query);

    return results
  }

  async findAllDepartments(
    lastDepartmentId: number | null,
    limit: number
    ): Promise<DepartmentResponse[]> {
        return this.prisma.$queryRaw<DepartmentResponse[]>`
            SELECT 
                d.department_id,
                d.department_nm,
                d.acronym,
                d.active
            FROM 
                tb_department d
            WHERE 
                d.active = true
                AND (${lastDepartmentId}::int IS NULL OR d.department_id > ${lastDepartmentId})
            ORDER BY 
                d.department_id ASC
            LIMIT ${limit};
        `;
    }
}