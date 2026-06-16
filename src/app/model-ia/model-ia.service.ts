import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceData } from '../types/general';
import { CreateModelIaDto } from './dto/create-model-ia.dto';
import { UpdateModelIaDto } from './dto/update-model-ia.dto';
import { DefaultModelIaDto } from './dto/default-model-ia.dto';

@Injectable()
export class ModelIaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ServiceData<CreateModelIaDto>) {
    const { modelNm, chatModel } = data.bodyData;

    const existing = await this.prisma.modelIa.findFirst({
      where: {
        OR: [
          { modelNm },
          { chatModel },
        ],
      },
    });

    if (existing) {
      if (existing.modelNm === modelNm) {
        throw new ConflictException('Modelo de IA já existe');
      }
      throw new ConflictException('Modelo de chat já existe');
    }

    return this.prisma.modelIa.create({
      data: { modelNm, chatModel },
      select: { modelIaId: true, modelNm: true, chatModel: true, active: true },
    });
  }

  async findAll() {
    return this.prisma.modelIa.findMany({
      where: { active: true },
      select: { modelIaId: true, modelNm: true, chatModel: true, active: true },
    });
  }

  /** GET opt — retorna apenas o nome do modelo e o identificador model_ia_id:model_key de cada chave ativa */
  async findAllOpt() {
    const models = await this.prisma.modelIa.findMany({
      where: { active: true },
      select: {
        modelNm: true,
        chatModel: true,
        modelIaKeys: {
          where: { active: true },
          select: { modelIaId: true, modelKey: true },
        },
      },
    });

    return models.map((m) => ({
      modelNm: m.modelNm,
      chatModel: m.chatModel,
      keys: m.modelIaKeys.map((k) => ({
        identifier: `${k.modelIaId}:${k.modelKey}`,
      })),
    }));
  }

  async findOne(data: ServiceData<DefaultModelIaDto>) {
    const model = await this.prisma.modelIa.findUnique({
      where: { modelIaId: data.bodyData.modelIaId },
      select: { modelIaId: true, modelNm: true, chatModel: true, active: true },
    });

    if (!model) {
      throw new NotFoundException('Modelo de IA não encontrado');
    }

    return model;
  }

  async update(data: ServiceData<UpdateModelIaDto>) {
    const { modelIaId, modelNm, chatModel, active } = data.bodyData;

    const model = await this.prisma.modelIa.findUnique({ where: { modelIaId } });

    if (!model) {
      throw new NotFoundException('Modelo de IA não encontrado');
    }

    if (modelNm && modelNm !== model.modelNm) {
      const conflict = await this.prisma.modelIa.findFirst({
        where: { modelNm, modelIaId: { not: modelIaId } },
      });

      if (conflict) {
        throw new ConflictException('Já existe um modelo com esse nome');
      }
    }

    if (chatModel && chatModel !== model.chatModel) {
      const conflict = await this.prisma.modelIa.findFirst({
        where: { chatModel, modelIaId: { not: modelIaId } },
      });

      if (conflict) {
        throw new ConflictException('Já existe um modelo com esse chat_model');
      }
    }

    return this.prisma.modelIa.update({
      where: { modelIaId },
      data: { modelNm, chatModel, active },
      select: { modelIaId: true, modelNm: true, chatModel: true, active: true },
    });
  }

  async remove(data: ServiceData<DefaultModelIaDto>) {
    const model = await this.prisma.modelIa.findUnique({
      where: { modelIaId: data.bodyData.modelIaId },
    });

    if (!model) {
      throw new NotFoundException('Modelo de IA não encontrado');
    }

    await this.prisma.modelIa.update({
      where: { modelIaId: data.bodyData.modelIaId },
      data: { active: false },
    });

    return { message: 'Modelo de IA desativado com sucesso' };
  }
}
