import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { ServiceData } from '../types/general';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DefaultDepartmentDto } from './dto/default-department.dto';
import { DepartmentRepository } from './department.repository';
import { DepartmentResponse } from './department.type';
import { ScrollingDepartmentDto } from './dto/scrolling-department.dto';

@Injectable()
export class DepartmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly departmentRepository: DepartmentRepository
  ) {}

  async create(data: ServiceData<CreateDepartmentDto>) {
    const { bodyData: createDepartmentDto } = data;
    const existingDepartment = await this.prisma.department.findFirst({
      where: { 
        OR: [
          { departmentNm: createDepartmentDto.departmentNm },
          { acronym: createDepartmentDto.acronym }
        ]
      },
    });

    if (existingDepartment) {
      throw new ConflictException('Departamento já existe');
    }

    const department = await this.prisma.department.create({
      data: {
        departmentNm: createDepartmentDto.departmentNm,
        acronym: createDepartmentDto.acronym,
      },
      select: {
        departmentId: true,
        departmentNm: true,
        acronym: true,
        active: true,
      },
    });

    return department;
  }

  async checkPerm (data: ServiceData<DefaultDepartmentDto>) {
    const {userId, typeUserId, bodyData} = data;
    const {departmentId} = bodyData;
    
    const department = await this.prisma.department.findUnique({
      where: { departmentId },
      select: {
        departmentId: true,
        departmentNm: true,
        acronym: true,
        active: true,
      },
    });
    
    if (!department) {
      throw new NotFoundException('Departamento não encontrado');
    }

    if (typeUserId === 2) {

      const exists = (await this.departmentRepository.findUserWithPermission(userId, departmentId))?.exists
      
      const hasPermission = exists === 1;
      
      if (!hasPermission) {
        throw new UnauthorizedException('Sem permissão para acessar este departamento');
      } 
      
    }

    if([1,2].includes(typeUserId)) {
      return department;
    }

    throw new UnauthorizedException('Sem permissão para acessar este departamento');
  }

  async findAll(data: ServiceData<ScrollingDepartmentDto>): Promise<{departments: DepartmentResponse[], finish: boolean}> {
    const {userId, typeUserId} = data;
    
    let departments: DepartmentResponse[] = [];
    let finish = true;

    let limit = Number(process.env.MAX_ITEMS)+1

    if (typeUserId === 1) {
      departments = await this.departmentRepository.findAllDepartments(
        data.bodyData.departmentId??null,
        limit
      );
    } else if(typeUserId === 2) {
      departments = await this.departmentRepository.findDepartmentsWithPagination(
        userId,
        data.bodyData.departmentId??null, 
        limit
      );
    }

    if(limit === departments.length) {
      finish = false;
      departments.pop()
    }

    return {
      departments,
      finish
    };
  }

  async findOne(data: ServiceData<DefaultDepartmentDto>): Promise<DepartmentResponse> {
    return await this.checkPerm(data)
  }

  async update(data: ServiceData<UpdateDepartmentDto>) {
    const departmentId = data.bodyData.departmentId;
    const updateData = data.bodyData;
    
    const department = await this.checkPerm(data)

    if (!department) {
      throw new NotFoundException('Departamento não encontrado');
    }

    if (updateData.departmentNm || updateData.acronym) {
      const existingDepartment = await this.prisma.department.findFirst({
        where: {
          AND: [
            { departmentId: { not: departmentId } },
            {
              OR: [
                updateData.departmentNm ? { departmentNm: updateData.departmentNm } : {},
                updateData.acronym ? { acronym: updateData.acronym } : {},
              ].filter(condition => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (existingDepartment) {
        throw new ConflictException('Departamento já existe');
      }
    }

    const updatedDepartment = await this.prisma.department.update({
      where: { departmentId },
      data: {
        departmentNm: updateData.departmentNm,
        acronym: updateData.acronym,
      },
      select: {
        departmentId: true,
        departmentNm: true,
        acronym: true,
        active: true,
      },
    });

    return updatedDepartment;
  }

  async remove(data: ServiceData<DefaultDepartmentDto>) {
    const departmentId = data.bodyData.departmentId;
    
    const department = await this.checkPerm(data)

    if (!department) {
      throw new NotFoundException('Departamento não encontrado');
    }

    await this.prisma.department.update({
      where: { departmentId },
      data: { active: false },
    });

    return { message: 'Departamento desativado com sucesso' };
  }

  async findByAcronym(acronym: string) {
    return this.prisma.department.findFirst({
      where: { acronym, active: true },
    });
  }
}
