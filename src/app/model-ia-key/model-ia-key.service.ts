import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceData } from '../types/general';
import { CreateModelIaKeyDto } from './dto/create-model-ia-key.dto';
import { UpdateModelIaKeyDto } from './dto/update-model-ia-key.dto';
import { DefaultModelIaKeyDto } from './dto/default-model-ia-key.dto';

@Injectable()
export class ModelIaKeyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ServiceData<CreateModelIaKeyDto>) {
    const { modelIaId, modelKey, qtnToken } = data.bodyData;

    const model = await this.prisma.modelIa.findUnique({ where: { modelIaId } });

    if (!model) {
      throw new NotFoundException('Modelo de IA não encontrado');
    }

    const existingKey = await this.prisma.modelIaKey.findUnique({
      where: { modelIaId_modelKey: { modelIaId, modelKey } },
    });

    if (existingKey) {
      throw new ConflictException('Chave de IA já existe para este modelo');
    }

    return this.prisma.modelIaKey.create({
      data: { modelIaId, modelKey, qtnToken },
      select: { modelIaId: true, modelKey: true, qtnToken: true, active: true },
    });
  }

  async findAll(modelIaId: number) {
    const model = await this.prisma.modelIa.findUnique({ where: { modelIaId } });

    if (!model) {
      throw new NotFoundException('Modelo de IA não encontrado');
    }

    return this.prisma.modelIaKey.findMany({
      where: { modelIaId, active: true },
      select: { modelIaId: true, modelKey: true, qtnToken: true, active: true },
    });
  }

  async update(data: ServiceData<UpdateModelIaKeyDto>) {
    const { modelIaId, modelKey, qtnToken, active } = data.bodyData;

    const key = await this.prisma.modelIaKey.findUnique({
      where: { modelIaId_modelKey: { modelIaId, modelKey } },
    });

    if (!key) {
      throw new NotFoundException('Chave de IA não encontrada');
    }

    return this.prisma.modelIaKey.update({
      where: { modelIaId_modelKey: { modelIaId, modelKey } },
      data: { qtnToken, active },
      select: { modelIaId: true, modelKey: true, qtnToken: true, active: true },
    });
  }

  async remove(data: ServiceData<DefaultModelIaKeyDto>) {
    const { modelIaId, modelKey } = data.bodyData;

    const key = await this.prisma.modelIaKey.findUnique({
      where: { modelIaId_modelKey: { modelIaId, modelKey } },
    });

    if (!key) {
      throw new NotFoundException('Chave de IA não encontrada');
    }

    await this.prisma.modelIaKey.update({
      where: { modelIaId_modelKey: { modelIaId, modelKey } },
      data: { active: false },
    });

    return { message: 'Chave de IA desativada com sucesso' };
  }
}
