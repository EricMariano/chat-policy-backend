import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ModelIaWithTokensSpent {
  modelIaId: number;
  modelNm: string;
  chatModel: string;
  active: boolean;
  tokensSpent: number | string;
}

@Injectable()
export class ModelIaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllWithTokensSpent(): Promise<ModelIaWithTokensSpent[]> {
    return this.prisma.$queryRaw<ModelIaWithTokensSpent[]>`
      SELECT
        tmi.model_ia_id AS "modelIaId",
        tmi.model_nm AS "modelNm",
        tmi.chat_model AS "chatModel",
        tmi.active,
        COALESCE(SUM(tth.amount_token_spent), 0) AS "tokensSpent"
      FROM tb_model_ia tmi
      LEFT JOIN tb_message tm
        ON tm.model_ia_id = tmi.model_ia_id
      LEFT JOIN tb_token_history tth
        ON tth.message_id = tm.message_id
      GROUP BY tmi.model_ia_id, tmi.model_nm, tmi.chat_model, tmi.active
      ORDER BY tmi.model_ia_id ASC
    `;
  }
}
