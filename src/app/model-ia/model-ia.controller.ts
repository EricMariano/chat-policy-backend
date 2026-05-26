import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ModelIaService } from './model-ia.service';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../role';
import { UserRole } from '../user/user.enum';
import { User } from '../user';
import type { JwtPayload } from '../types/jwt';
import { ServiceData } from '../types/general';
import { CreateModelIaDto } from './dto/create-model-ia.dto';
import { UpdateModelIaDto } from './dto/update-model-ia.dto';
import { DefaultModelIaDto } from './dto/default-model-ia.dto';

@ApiTags('model-ia')
@Controller('model-ia')
export class ModelIaController {
  constructor(private readonly modelIaService: ModelIaService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar novo modelo de IA' })
  @ApiBody({ type: CreateModelIaDto })
  @ApiResponse({ status: 201, description: 'Modelo criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Modelo já existe' })
  create(@User() user: JwtPayload, @Body() body: CreateModelIaDto) {
    const serviceData: ServiceData<CreateModelIaDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };
    return this.modelIaService.create(serviceData);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Listar todos os modelos de IA ativos' })
  @ApiResponse({ status: 200, description: 'Lista de modelos' })
  findAll() {
    return this.modelIaService.findAll();
  }

  @Get('opt')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Listar modelos com nome e identificador de chave (model_ia_id:model_key)' })
  @ApiResponse({ status: 200, description: 'Lista simplificada de modelos e chaves' })
  findAllOpt() {
    return this.modelIaService.findAllOpt();
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Buscar modelo de IA por ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Modelo encontrado' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  findOne(@User() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    const serviceData: ServiceData<DefaultModelIaDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: { modelIaId: id },
    };
    return this.modelIaService.findOne(serviceData);
  }

  @Patch()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar modelo de IA' })
  @ApiBody({ type: UpdateModelIaDto })
  @ApiResponse({ status: 200, description: 'Modelo atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  update(@User() user: JwtPayload, @Body() body: UpdateModelIaDto) {
    const serviceData: ServiceData<UpdateModelIaDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };
    return this.modelIaService.update(serviceData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Desativar modelo de IA (soft delete)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Modelo desativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  remove(@User() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    const serviceData: ServiceData<DefaultModelIaDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: { modelIaId: id },
    };
    return this.modelIaService.remove(serviceData);
  }
}
