import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserByEmailResponse, UserFilterResponse } from './user.type';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserByEmailResponse[]> {
    const result = await this.prisma.$queryRaw<UserByEmailResponse[]>`
      SELECT
        email,
        name,
        user_id AS "userId"
      FROM tb_user
      WHERE email LIKE CONCAT('%', ${email}::varchar, '%');
    `;

    return result || [];
  }

  async findUsersWithFilters(filters: {
    active?: boolean;
    name?: string;
    userType?: number;
    limit: number;
    offset: number;
  }): Promise<UserFilterResponse[]> {
    const { active, name, userType, limit, offset } = filters;

    let whereConditions: string[] = [];
    const params: any[] = [];

    if (active !== undefined) {
      whereConditions.push(`active = $${params.length + 1}`);
      params.push(active);
    }

    if (name) {
      whereConditions.push(`name ILIKE $${params.length + 1}`);
      params.push(`%${name}%`);
    }

    if (userType !== undefined) {
      whereConditions.push(`type_user_id = $${params.length + 1}`);
      params.push(userType);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const query = `
      SELECT
        user_id AS "userId",
        name AS "name",
        email AS "email",
        registered_at AS "registeredAt",
        type_user_id AS "typeUserId",
        active AS "active"
      FROM tb_user
      ${whereClause}
      ORDER BY name ASC, user_id ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;

    params.push(limit, offset);

    return this.prisma.$queryRawUnsafe<UserFilterResponse[]>(query, ...params);
  }

  async countUsersWithFilters(filters: {
    active?: boolean;
    name?: string;
    userType?: number;
  }): Promise<{ totalUsers: bigint }> {
    const { active, name, userType } = filters;

    let whereConditions: string[] = [];
    const params: any[] = [];

    if (active !== undefined) {
      whereConditions.push(`active = $${params.length + 1}`);
      params.push(active);
    }

    if (name) {
      whereConditions.push(`name ILIKE $${params.length + 1}`);
      params.push(`%${name}%`);
    }

    if (userType !== undefined) {
      whereConditions.push(`type_user_id = $${params.length + 1}`);
      params.push(userType);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const query = `
      SELECT
        COUNT(*) AS "totalUsers"
      FROM tb_user
      ${whereClause};
    `;

    const result = await this.prisma.$queryRawUnsafe<{ totalUsers: bigint }[]>(query, ...params);
    return result[0];
  }
}
