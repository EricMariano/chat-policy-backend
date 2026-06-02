import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceData } from '../types/general';
import { CreatePermissionGroupDto } from './dto/create-permission-group.dto';
import { UpdatePermissionGroupDto } from './dto/update-permission-group.dto';
import { DefaultPermissionGroupDto } from './dto/default-permission-group.dto';
import { PermissionGroupUserDto } from './dto/permission-group-user.dto';
import { PermissionGroupDepartmentDto } from './dto/permission-group-department.dto';
import { PermissionGroupSystemDto } from './dto/permission-group-system.dto';
import { FilterPermissionGroupsDto } from './dto/filter-permission-groups.dto';
import { PermissionGroupRepository } from './permission-group.repository';
import { ScrollingPermissionGroupUsersDto } from './dto/scrolling-permission-group-users.dto';
import { FilterPermissionGroupAccessDto } from './dto/filter-permission-group-access.dto';

@Injectable()
export class PermissionGroupService {
  private readonly permissionGroupSelect = {
    permissionGroupId: true,
    permissionGroupNm: true,
    active: true,
    permissionGroupUsers: {
      select: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            active: true,
          },
        },
      },
    },
    permissionGroupDepartments: {
      select: {
        department: {
          select: {
            departmentId: true,
            departmentNm: true,
            acronym: true,
            active: true,
          },
        },
      },
    },
    permissionGroupSystems: {
      select: {
        system: {
          select: {
            systemId: true,
            systemNm: true,
            acronym: true,
            active: true,
          },
        },
      },
    },
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionGroupRepository: PermissionGroupRepository,
  ) {}

  async create(data: ServiceData<CreatePermissionGroupDto>): Promise<any> {
    const { permissionGroupNm } = data.bodyData;

    const existing = await this.prisma.permissionGroup.findFirst({
      where: { permissionGroupNm },
    });

    if (existing) {
      throw new ConflictException('Grupo de permissão já existe');
    }

    const newPermissionGroup = await this.prisma.permissionGroup.create({
      data: { permissionGroupNm },
    });

    return newPermissionGroup;
  }

  async findWithPagination(bodyData: FilterPermissionGroupsDto): Promise<any> {
    const {
      permissionGroupNm,
      departmentsIds,
      systemsIds,
      limit,
      currentPage,
    } = bodyData;

    const offset = (currentPage - 1) * limit;

    const count =
      await this.permissionGroupRepository.countPermissionGroupsWithFilters({
        permissionGroupNm,
        departmentsIds,
        systemsIds,
      });

    const permissionGroups =
      await this.permissionGroupRepository.findPermissionGroupsWithFilters({
        permissionGroupNm,
        departmentsIds,
        systemsIds,
        limit,
        offset,
      });

    const totalItems = Number(count.totalPermissionGroups);
    const pages = Math.ceil(totalItems / limit);

    return {
      data: permissionGroups,
      totalItems,
      pages,
    };
  }

  async findUsersWithScrolling(
    bodyData: ScrollingPermissionGroupUsersDto & { permissionGroupId: number },
  ): Promise<any> {
    const { permissionGroupId, userId, name } = bodyData;

    await this.findPermissionGroupOrThrow(permissionGroupId);

    const limit = Number(process.env.MAX_ITEMS) + 1;
    const users =
      await this.permissionGroupRepository.findUsersByPermissionGroupWithScrolling(
        permissionGroupId,
        userId ?? null,
        name ?? null,
        limit,
      );

    let finish = true;

    if (limit === users.length) {
      finish = false;
      users.pop();
    }

    return {
      data: users,
      finish,
    };
  }

  async findDepartmentsByPermissionGroup(
    permissionGroupId: number,
    query: FilterPermissionGroupAccessDto,
  ): Promise<any> {
    await this.findPermissionGroupOrThrow(permissionGroupId);

    return await this.permissionGroupRepository.findDepartmentsByPermissionGroup(
      permissionGroupId,
      query.name ?? null,
    );
  }

  async findSystemsByPermissionGroup(
    permissionGroupId: number,
    query: FilterPermissionGroupAccessDto,
  ): Promise<any> {
    await this.findPermissionGroupOrThrow(permissionGroupId);

    return await this.permissionGroupRepository.findSystemsByPermissionGroup(
      permissionGroupId,
      query.name ?? null,
    );
  }

  async findOne(data: ServiceData<DefaultPermissionGroupDto>): Promise<any> {
    return await this.findPermissionGroupOrThrow(
      data.bodyData.permissionGroupId,
    );
  }

  async update(data: ServiceData<UpdatePermissionGroupDto>): Promise<any> {
    const { permissionGroupId, permissionGroupNm } = data.bodyData;

    await this.findPermissionGroupOrThrow(permissionGroupId);

    const conflict = await this.prisma.permissionGroup.findFirst({
      where: {
        permissionGroupId: { not: permissionGroupId },
        permissionGroupNm,
      },
    });

    if (conflict) {
      throw new ConflictException(
        'Já existe um grupo de permissão com esse nome',
      );
    }

    const updatedPermissionGroup = await this.prisma.permissionGroup.update({
      where: { permissionGroupId },
      data: { permissionGroupNm },
    });

    return updatedPermissionGroup;
  }

  async toggleActive(
    data: ServiceData<DefaultPermissionGroupDto>,
  ): Promise<any> {
    const permissionGroup = await this.findPermissionGroupOrThrow(
      data.bodyData.permissionGroupId,
    );

    const toggledPermissionGroup = await this.prisma.permissionGroup.update({
      where: { permissionGroupId: permissionGroup.permissionGroupId },
      data: { active: !permissionGroup.active },
    });

    return toggledPermissionGroup;
  }

  async addUser(data: ServiceData<PermissionGroupUserDto>): Promise<any> {
    const { permissionGroupId, userId } = data.bodyData;

    await this.findPermissionGroupOrThrow(permissionGroupId);
    await this.findUserOrThrow(userId);

    const existing = await this.prisma.permissionGroupUser.findUnique({
      where: { permissionGroupId_userId: { permissionGroupId, userId } },
    });

    if (existing) {
      throw new ConflictException('Usuário já está no grupo de permissão');
    }

    const newPermissionGroupUser = await this.prisma.permissionGroupUser.create(
      {
        data: { permissionGroupId, userId },
      },
    );

    return newPermissionGroupUser;
  }

  async removeUser(data: ServiceData<PermissionGroupUserDto>): Promise<any> {
    const { permissionGroupId, userId } = data.bodyData;

    await this.findPermissionGroupOrThrow(permissionGroupId);
    await this.findUserOrThrow(userId);

    const existing = await this.prisma.permissionGroupUser.findUnique({
      where: { permissionGroupId_userId: { permissionGroupId, userId } },
    });

    if (!existing) {
      throw new NotFoundException('Usuário não está no grupo de permissão');
    }

    const removedPermissionGroupUser =
      await this.prisma.permissionGroupUser.delete({
        where: { permissionGroupId_userId: { permissionGroupId, userId } },
      });

    return removedPermissionGroupUser;
  }

  async addDepartment(
    data: ServiceData<PermissionGroupDepartmentDto>,
  ): Promise<any> {
    const { permissionGroupId, departmentId } = data.bodyData;

    await this.findPermissionGroupOrThrow(permissionGroupId);
    await this.findDepartmentOrThrow(departmentId);

    const existing = await this.prisma.permissionGroupDepartment.findUnique({
      where: {
        permissionGroupId_departmentId: { permissionGroupId, departmentId },
      },
    });

    if (existing) {
      throw new ConflictException('Departamento já está no grupo de permissão');
    }

    const newPermissionGroupDepartment =
      await this.prisma.permissionGroupDepartment.create({
        data: { permissionGroupId, departmentId },
      });

    return newPermissionGroupDepartment;
  }

  async removeDepartment(
    data: ServiceData<PermissionGroupDepartmentDto>,
  ): Promise<any> {
    const { permissionGroupId, departmentId } = data.bodyData;

    await this.findPermissionGroupOrThrow(permissionGroupId);

    const existing = await this.prisma.permissionGroupDepartment.findUnique({
      where: {
        permissionGroupId_departmentId: { permissionGroupId, departmentId },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        'Departamento não está no grupo de permissão',
      );
    }

    const removedPermissionGroupDepartment =
      await this.prisma.permissionGroupDepartment.delete({
        where: {
          permissionGroupId_departmentId: { permissionGroupId, departmentId },
        },
      });

    return removedPermissionGroupDepartment;
  }

  async addSystem(data: ServiceData<PermissionGroupSystemDto>): Promise<any> {
    const { permissionGroupId, systemId } = data.bodyData;

    await this.findPermissionGroupOrThrow(permissionGroupId);
    await this.findSystemOrThrow(systemId);

    const existing = await this.prisma.permissionGroupSystem.findUnique({
      where: { permissionGroupId_systemId: { permissionGroupId, systemId } },
    });

    if (existing) {
      throw new ConflictException('Sistema já está no grupo de permissão');
    }

    const newPermissionGroupSystem =
      await this.prisma.permissionGroupSystem.create({
        data: { permissionGroupId, systemId },
      });

    return newPermissionGroupSystem;
  }

  async removeSystem(
    data: ServiceData<PermissionGroupSystemDto>,
  ): Promise<any> {
    const { permissionGroupId, systemId } = data.bodyData;

    await this.findPermissionGroupOrThrow(permissionGroupId);

    const existing = await this.prisma.permissionGroupSystem.findUnique({
      where: { permissionGroupId_systemId: { permissionGroupId, systemId } },
    });

    if (!existing) {
      throw new NotFoundException('Sistema não está no grupo de permissão');
    }

    const removedPermissionGroupSystem =
      await this.prisma.permissionGroupSystem.delete({
        where: { permissionGroupId_systemId: { permissionGroupId, systemId } },
      });

    return removedPermissionGroupSystem;
  }

  private async findPermissionGroupOrThrow(
    permissionGroupId: number,
  ): Promise<any> {
    const permissionGroup = await this.prisma.permissionGroup.findUnique({
      where: { permissionGroupId },
      select: this.permissionGroupSelect,
    });

    if (!permissionGroup) {
      throw new NotFoundException('Grupo de permissão não encontrado');
    }

    return permissionGroup;
  }

  private async findUserOrThrow(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { userId: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
  }

  private async findDepartmentOrThrow(departmentId: number): Promise<void> {
    const department = await this.prisma.department.findUnique({
      where: { departmentId },
      select: { departmentId: true },
    });

    if (!department) {
      throw new NotFoundException('Departamento não encontrado');
    }
  }

  private async findSystemOrThrow(systemId: number): Promise<void> {
    const system = await this.prisma.system.findUnique({
      where: { systemId },
      select: { systemId: true },
    });

    if (!system) {
      throw new NotFoundException('Sistema não encontrado');
    }
  }
}
