import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserByEmailResponse } from './user.type';

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
}
