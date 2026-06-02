import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { PermissionGroupService } from './permission-group.service';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../role';
import { UserRole } from '../user/user.enum';
import { User } from '../user';
import type { JwtPayload } from '../types/jwt';
import { ServiceData } from '../types/general';
import { CreatePermissionGroupDto } from './dto/create-permission-group.dto';
import { UpdatePermissionGroupDto } from './dto/update-permission-group.dto';
import { DefaultPermissionGroupDto } from './dto/default-permission-group.dto';
import { PermissionGroupUserDto } from './dto/permission-group-user.dto';
import { PermissionGroupDepartmentDto } from './dto/permission-group-department.dto';
import { PermissionGroupSystemDto } from './dto/permission-group-system.dto';
import { FilterPermissionGroupsDto } from './dto/filter-permission-groups.dto';
import { ScrollingPermissionGroupUsersDto } from './dto/scrolling-permission-group-users.dto';
import { FilterPermissionGroupAccessDto } from './dto/filter-permission-group-access.dto';

@ApiTags('permission-group')
@Controller('permission-groups')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PermissionGroupController {
  constructor(
    private readonly permissionGroupService: PermissionGroupService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo grupo de permissão' })
  @ApiBody({ type: CreatePermissionGroupDto })
  @ApiResponse({
    status: 201,
    description: 'Grupo de permissão criado com sucesso',
  })
  @ApiResponse({ status: 409, description: 'Grupo de permissão já existe' })
  async create(
    @User() user: JwtPayload,
    @Body() body: CreatePermissionGroupDto,
  ) {
    const serviceData: ServiceData<CreatePermissionGroupDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };

    return await this.permissionGroupService.create(serviceData);
  }

  @Get('pagination')
  @ApiOperation({ summary: 'Listar grupos de permissão com paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de grupos de permissão',
  })
  async findWithPagination(@Query() query: FilterPermissionGroupsDto) {
    return await this.permissionGroupService.findWithPagination(query);
  }

  @Get(':permissionGroupId/users/scrolling')
  @ApiOperation({
    summary: 'Listar usuários do grupo de permissão com scrolling',
  })
  @ApiParam({ name: 'permissionGroupId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários do grupo de permissão',
  })
  async findUsersWithScrolling(
    @Param('permissionGroupId', ParseIntPipe) permissionGroupId: number,
    @Query() query: ScrollingPermissionGroupUsersDto,
  ) {
    return await this.permissionGroupService.findUsersWithScrolling({
      ...query,
      permissionGroupId,
    });
  }

  @Get(':permissionGroupId/departments')
  @ApiOperation({
    summary: 'Listar departamentos do grupo de permissão',
  })
  @ApiParam({ name: 'permissionGroupId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Lista de departamentos do grupo de permissão',
  })
  async findDepartmentsByPermissionGroup(
    @Param('permissionGroupId', ParseIntPipe) permissionGroupId: number,
    @Query() query: FilterPermissionGroupAccessDto,
  ) {
    return await this.permissionGroupService.findDepartmentsByPermissionGroup(
      permissionGroupId,
      query,
    );
  }

  @Get(':permissionGroupId/systems')
  @ApiOperation({
    summary: 'Listar sistemas do grupo de permissão',
  })
  @ApiParam({ name: 'permissionGroupId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Lista de sistemas do grupo de permissão',
  })
  async findSystemsByPermissionGroup(
    @Param('permissionGroupId', ParseIntPipe) permissionGroupId: number,
    @Query() query: FilterPermissionGroupAccessDto,
  ) {
    return await this.permissionGroupService.findSystemsByPermissionGroup(
      permissionGroupId,
      query,
    );
  }

  @Post('users')
  @ApiOperation({ summary: 'Adicionar usuário ao grupo de permissão' })
  @ApiBody({ type: PermissionGroupUserDto })
  @ApiResponse({
    status: 201,
    description: 'Usuário adicionado ao grupo de permissão',
  })
  async addUser(
    @User() user: JwtPayload,
    @Body() body: PermissionGroupUserDto,
  ) {
    const serviceData: ServiceData<PermissionGroupUserDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };

    return await this.permissionGroupService.addUser(serviceData);
  }

  @Delete(':permissionGroupId/users/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover usuário do grupo de permissão' })
  @ApiParam({ name: 'permissionGroupId', type: 'number' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Usuário removido do grupo de permissão',
  })
  async removeUser(
    @User() user: JwtPayload,
    @Param('permissionGroupId', ParseIntPipe) permissionGroupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const serviceData: ServiceData<PermissionGroupUserDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: { permissionGroupId, userId },
    };

    return await this.permissionGroupService.removeUser(serviceData);
  }

  @Post('departments')
  @ApiOperation({ summary: 'Adicionar departamento ao grupo de permissão' })
  @ApiBody({ type: PermissionGroupDepartmentDto })
  @ApiResponse({
    status: 201,
    description: 'Departamento adicionado ao grupo de permissão',
  })
  async addDepartment(
    @User() user: JwtPayload,
    @Body() body: PermissionGroupDepartmentDto,
  ) {
    const serviceData: ServiceData<PermissionGroupDepartmentDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };

    return await this.permissionGroupService.addDepartment(serviceData);
  }

  @Delete(':permissionGroupId/departments/:departmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover departamento do grupo de permissão' })
  @ApiParam({ name: 'permissionGroupId', type: 'number' })
  @ApiParam({ name: 'departmentId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Departamento removido do grupo de permissão',
  })
  async removeDepartment(
    @User() user: JwtPayload,
    @Param('permissionGroupId', ParseIntPipe) permissionGroupId: number,
    @Param('departmentId', ParseIntPipe) departmentId: number,
  ) {
    const serviceData: ServiceData<PermissionGroupDepartmentDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: { permissionGroupId, departmentId },
    };

    return await this.permissionGroupService.removeDepartment(serviceData);
  }

  @Post('systems')
  @ApiOperation({ summary: 'Adicionar sistema ao grupo de permissão' })
  @ApiBody({ type: PermissionGroupSystemDto })
  @ApiResponse({
    status: 201,
    description: 'Sistema adicionado ao grupo de permissão',
  })
  async addSystem(
    @User() user: JwtPayload,
    @Body() body: PermissionGroupSystemDto,
  ) {
    const serviceData: ServiceData<PermissionGroupSystemDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };

    return await this.permissionGroupService.addSystem(serviceData);
  }

  @Delete(':permissionGroupId/systems/:systemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover sistema do grupo de permissão' })
  @ApiParam({ name: 'permissionGroupId', type: 'number' })
  @ApiParam({ name: 'systemId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Sistema removido do grupo de permissão',
  })
  async removeSystem(
    @User() user: JwtPayload,
    @Param('permissionGroupId', ParseIntPipe) permissionGroupId: number,
    @Param('systemId', ParseIntPipe) systemId: number,
  ) {
    const serviceData: ServiceData<PermissionGroupSystemDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: { permissionGroupId, systemId },
    };

    return await this.permissionGroupService.removeSystem(serviceData);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar grupo de permissão por ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Grupo de permissão encontrado' })
  @ApiResponse({
    status: 404,
    description: 'Grupo de permissão não encontrado',
  })
  async findOne(
    @User() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const serviceData: ServiceData<DefaultPermissionGroupDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: { permissionGroupId: id },
    };

    return await this.permissionGroupService.findOne(serviceData);
  }

  @Patch()
  @ApiOperation({ summary: 'Atualizar grupo de permissão' })
  @ApiBody({ type: UpdatePermissionGroupDto })
  @ApiResponse({
    status: 200,
    description: 'Grupo de permissão atualizado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Grupo de permissão não encontrado',
  })
  async update(
    @User() user: JwtPayload,
    @Body() body: UpdatePermissionGroupDto,
  ) {
    const serviceData: ServiceData<UpdatePermissionGroupDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };

    return await this.permissionGroupService.update(serviceData);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Ativar ou desativar grupo de permissão' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Status do grupo de permissão alterado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Grupo de permissão não encontrado',
  })
  async toggleActive(
    @User() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const serviceData: ServiceData<DefaultPermissionGroupDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: { permissionGroupId: id },
    };

    return await this.permissionGroupService.toggleActive(serviceData);
  }
}
