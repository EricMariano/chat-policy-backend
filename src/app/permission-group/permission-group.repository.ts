import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PermissionGroupDepartmentResponse,
  PermissionGroupFilter,
  PermissionGroupListResponse,
  PermissionGroupPaginationFilter,
  PermissionGroupSystemResponse,
  PermissionGroupUserResponse,
} from './permission-group.type';

@Injectable()
export class PermissionGroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPermissionGroupsWithFilters(
    filters: PermissionGroupPaginationFilter,
  ): Promise<PermissionGroupListResponse[]> {
    const { limit, offset } = filters;
    const params: any[] = [];
    const whereClause = this.buildWhereClause(filters, params);

    const query = `
      SELECT
        pg.permission_group_id AS "permissionGroupId",
        pg.permission_group_nm AS "permissionGroupNm",
        pg.active AS "active"
      FROM tb_permission_group pg
      ${whereClause}
      ORDER BY pg.permission_group_nm ASC, pg.permission_group_id ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;

    params.push(limit, offset);

    return await this.prisma.$queryRawUnsafe<PermissionGroupListResponse[]>(
      query,
      ...params,
    );
  }

  async countPermissionGroupsWithFilters(
    filters: PermissionGroupFilter,
  ): Promise<{ totalPermissionGroups: bigint }> {
    const params: any[] = [];
    const whereClause = this.buildWhereClause(filters, params);

    const query = `
      SELECT
        COUNT(DISTINCT pg.permission_group_id) AS "totalPermissionGroups"
      FROM tb_permission_group pg
      ${whereClause};
    `;

    const result = await this.prisma.$queryRawUnsafe<
      { totalPermissionGroups: bigint }[]
    >(query, ...params);

    return result[0];
  }

  async findUsersByPermissionGroupWithScrolling(
    permissionGroupId: number,
    lastUserId: number | null,
    name: string | null,
    limit: number,
  ): Promise<PermissionGroupUserResponse[]> {
    const params: any[] = [permissionGroupId, lastUserId];
    const whereConditions = [
      'pgu.permission_group_id = $1',
      `(
        $2::int IS NULL
        OR (u.name, u.user_id) > (
          SELECT cursor_user.name, cursor_user.user_id
          FROM tb_user cursor_user
          INNER JOIN tb_permission_group_user cursor_pgu
            ON cursor_pgu.user_id = cursor_user.user_id
          WHERE cursor_pgu.permission_group_id = $1
            AND cursor_user.user_id = $2
          LIMIT 1
        )
      )`,
    ];

    if (name) {
      whereConditions.push(`u.name ILIKE $${params.length + 1}`);
      params.push(`%${name}%`);
    }

    const query = `
      SELECT
        u.user_id AS "userId",
        u.name AS "name",
        u.email AS "email",
        u.active AS "active"
      FROM tb_permission_group_user pgu
      INNER JOIN tb_user u
        ON u.user_id = pgu.user_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY u.name ASC, u.user_id ASC
      LIMIT $${params.length + 1};
    `;

    params.push(limit);

    return await this.prisma.$queryRawUnsafe<PermissionGroupUserResponse[]>(
      query,
      ...params,
    );
  }

  async findDepartmentsByPermissionGroup(
    permissionGroupId: number,
    name: string | null,
  ): Promise<PermissionGroupDepartmentResponse[]> {
    const params: any[] = [permissionGroupId];
    const whereConditions = ['pgd.permission_group_id = $1', 'd.active = true'];

    if (name) {
      whereConditions.push(`d.department_nm ILIKE $${params.length + 1}`);
      params.push(`%${name}%`);
    }

    const query = `
      SELECT
        d.department_id AS "departmentId",
        d.department_nm AS "departmentNm",
        d.acronym AS "acronym",
        d.active AS "active"
      FROM tb_permission_group_department pgd
      INNER JOIN tb_department d
        ON d.department_id = pgd.department_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY d.department_nm ASC, d.department_id ASC;
    `;

    return await this.prisma.$queryRawUnsafe<
      PermissionGroupDepartmentResponse[]
    >(query, ...params);
  }

  async findSystemsByPermissionGroup(
    permissionGroupId: number,
    name: string | null,
  ): Promise<PermissionGroupSystemResponse[]> {
    const params: any[] = [permissionGroupId];
    const whereConditions = ['pgs.permission_group_id = $1', 's.active = true'];

    if (name) {
      whereConditions.push(`s.system_nm ILIKE $${params.length + 1}`);
      params.push(`%${name}%`);
    }

    const query = `
      SELECT
        s.system_id AS "systemId",
        s.system_nm AS "systemNm",
        s.acronym AS "acronym",
        s.active AS "active"
      FROM tb_permission_group_system pgs
      INNER JOIN tb_system s
        ON s.system_id = pgs.system_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY s.system_nm ASC, s.system_id ASC;
    `;

    return await this.prisma.$queryRawUnsafe<PermissionGroupSystemResponse[]>(
      query,
      ...params,
    );
  }

  private buildWhereClause(
    filters: PermissionGroupFilter,
    params: any[],
  ): string {
    const { permissionGroupNm, departmentsIds, systemsIds } = filters;
    const whereConditions = ['pg.active = true'];

    if (permissionGroupNm) {
      whereConditions.push(
        `pg.permission_group_nm ILIKE $${params.length + 1}`,
      );
      params.push(`%${permissionGroupNm}%`);
    }

    if (departmentsIds && departmentsIds.length > 0) {
      whereConditions.push(`
        EXISTS (
          SELECT 1
          FROM tb_permission_group_department pgd_filter
          WHERE pgd_filter.permission_group_id = pg.permission_group_id
            AND pgd_filter.department_id = ANY($${params.length + 1}::int[])
        )
      `);
      params.push(departmentsIds);
    }

    if (systemsIds && systemsIds.length > 0) {
      whereConditions.push(`
        EXISTS (
          SELECT 1
          FROM tb_permission_group_system pgs_filter
          WHERE pgs_filter.permission_group_id = pg.permission_group_id
            AND pgs_filter.system_id = ANY($${params.length + 1}::int[])
        )
      `);
      params.push(systemsIds);
    }

    return `WHERE ${whereConditions.join(' AND ')}`;
  }
}
