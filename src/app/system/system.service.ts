import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSystemDto } from './dto/create-system.dto.js';
import { ServiceData } from '../types/general.js';
import { UpdateSystemDto } from './dto/update-system.dto.js';
import { DefaultSystemDto } from './dto/default-system.dto.js';
import { SystemRepository } from './system.repository.js';
import { SystemResponse } from './system.type.js';
import { ScrollingSystemDto } from './dto/scrolling-system.dto.js';

@Injectable()
export class SystemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemRepository: SystemRepository
  ) {}

  async create(data: ServiceData<CreateSystemDto>) {
    const { bodyData: createSystemDto } = data;
    
    const existingSystem = await this.prisma.system.findFirst({
      where: {
        OR: [
          { systemNm: createSystemDto.systemNm },
          { acronym: createSystemDto.acronym }
        ]
      },
    });

    if (existingSystem && existingSystem.acronym === data.bodyData.acronym) {
      throw new ConflictException('Sigla já está sendo usada');
    }

    if (existingSystem && existingSystem.systemNm === data.bodyData.systemNm) {
      throw new ConflictException('Nome já está sendo usado');
    }

    return this.prisma.system.create({
      data: {
        systemNm: createSystemDto.systemNm,
        acronym: createSystemDto.acronym,
        active: true,
      },
      select: {
        systemId: true,
        systemNm: true,
        acronym: true,
        active: true,
      },
    });
  }

  async checkPerm(data: ServiceData<DefaultSystemDto>) {
    const {userId, typeUserId} = data;
    const {systemId} = data.bodyData;
    
    const system = await this.prisma.system.findUnique({
      where: { systemId },
      select: {
        systemId: true,
        systemNm: true,
        acronym: true,
        active: true,
      },
    });
    
    if (!system) {
      throw new NotFoundException('Sistema não encontrado');
    }

    // Se for admin, pode acessar qualquer sistema
    if (typeUserId === 1) {
      return system;
    }

    // Se não for admin, verificar se o usuário tem permissão para este sistema
    const exists = (await this.systemRepository.findUserWithPermission(userId, systemId))?.exists;
    const hasPermission = exists === 1;
    
    if (!hasPermission) {
      throw new UnauthorizedException('Sem permissão para acessar este sistema');
    }
    
    return system;
  }

  async findAll(data: ServiceData<ScrollingSystemDto>): Promise<{data: SystemResponse[], finish: boolean}> {
    const {userId, typeUserId} = data;
    
    let systems: SystemResponse[] = [];
    let finish = true;

    let limit = Number(process.env.MAX_ITEMS)+1

    if (typeUserId === 1) {
      systems = await this.systemRepository.findAllSystems(
        data.bodyData.systemId??null,
        limit
      );
    } else if(typeUserId === 2) {
      systems = await this.systemRepository.findSystemsWithPagination(
        userId,
        data.bodyData.systemId??null, 
        limit
      );
    }

    if(limit === systems.length) {
      finish = false;
      systems.pop();
    }

    return {
      data:systems,
      finish
    };
  }

  async findOne(data: ServiceData<DefaultSystemDto>): Promise<SystemResponse> {
    return await this.checkPerm(data)
  }

  async update(data: ServiceData<UpdateSystemDto>) {
    const systemId = data.bodyData.systemId;
    const updateData = data.bodyData;
    
    const system = await this.checkPerm(data)

    if (updateData.systemNm || updateData.acronym) {
      const existingSystem = await this.prisma.system.findFirst({
        where: {
          AND: [
            { systemId: { not: systemId } },
            {
              OR: [
                { systemNm: updateData.systemNm },
                { acronym: updateData.acronym },
              ],
            },
          ],
        },
      });

      if (existingSystem && existingSystem.acronym === data.bodyData.acronym) {
        throw new ConflictException('Sigla já está sendo usada');
      }

      if (existingSystem && existingSystem.systemNm === data.bodyData.systemNm) {
        throw new ConflictException('Nome já está sendo usado');
      }
    }

    return this.prisma.system.update({
      where: { systemId },
      data: updateData,
      select: {
        systemId: true,
        systemNm: true,
        acronym: true,
        active: true,
      },
    });
  }

  async remove(data: ServiceData<DefaultSystemDto>) {
    const systemId = data.bodyData.systemId;
    
    const system = await this.checkPerm(data)

    if (!system) {
      throw new NotFoundException('Sistema não encontrado');
    }

    return this.prisma.system.update({
      where: { systemId },
      data: { active: false },
      select: {
        systemId: true,
        systemNm: true,
        acronym: true,
        active: true,
      },
    });
  }
}
