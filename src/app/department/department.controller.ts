import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { DepartmentService } from './department.service.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { ServiceData } from '../types/general';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { DefaultDepartmentDto } from './dto/default-department.dto.js';
import { AuthGuard } from '../guards/auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { UserRole } from '../user/user.enum.js';
import { Roles } from '../role.js';
import { User } from '../user.js';
import {type JwtPayload } from '../types/jwt.js';
import { ScrollingDepartmentDto } from './dto/scrolling-department.dto.js';

@ApiTags('department')
@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo departamento' })
  @ApiBody({ type: CreateDepartmentDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.USER)
  @ApiResponse({ status: 201, description: 'Departamento criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Departamento já existe' })
  create(@User() user:JwtPayload, @Body() createDepartmentDto: CreateDepartmentDto) {
    const serviceData: ServiceData<CreateDepartmentDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: createDepartmentDto
    };
    return this.departmentService.create(serviceData);
  }

  @Get("scrolling")
  @ApiOperation({ summary: 'Listar todos os departamentos ativos com scrolling' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.USER)
  @ApiResponse({ status: 200, description: 'Lista de departamentos' })
  findAll(@User() user:JwtPayload,@Query() queryParams: ScrollingDepartmentDto) {
    const serviceData: ServiceData<ScrollingDepartmentDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData:queryParams
    };
    return this.departmentService.findAll(serviceData);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar departamento por ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.USER)
  @ApiResponse({ status: 200, description: 'Departamento encontrado' })
  @ApiResponse({ status: 404, description: 'Departamento não encontrado' })
  findOne(@User() user:JwtPayload,@Param('id', ParseIntPipe) id: number) {
    const serviceData: ServiceData<DefaultDepartmentDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: {departmentId: id}
    };
    return this.departmentService.findOne(serviceData);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar departamento' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBody({ type: UpdateDepartmentDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({ status: 200, description: 'Departamento atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Departamento não encontrado' })
  update(
    @User() user:JwtPayload,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const serviceData: ServiceData<UpdateDepartmentDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: updateDepartmentDto
    };
    return this.departmentService.update(serviceData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Desativar departamento (soft delete)' })
  @ApiResponse({ status: 200, description: 'Departamento desativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Departamento não encontrado' })
  remove(
    @User() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number
  ) {
    const serviceData: ServiceData<DefaultDepartmentDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: {departmentId: id}
    };
    return this.departmentService.remove(serviceData);
  }
}
