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
import { ModelIaKeyService } from './model-ia-key.service';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../role';
import { UserRole } from '../user/user.enum';
import { User } from '../user';
import type { JwtPayload } from '../types/jwt';
import { ServiceData } from '../types/general';
import { CreateModelIaKeyDto } from './dto/create-model-ia-key.dto';
import { UpdateModelIaKeyDto } from './dto/update-model-ia-key.dto';
import { DefaultModelIaKeyDto } from './dto/default-model-ia-key.dto';

@ApiTags('model-ia-key')
@Controller('model-ia-key')
export class ModelIaKeyController {
  constructor(private readonly modelIaKeyService: ModelIaKeyService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar nova chave para um modelo de IA' })
  @ApiBody({ type: CreateModelIaKeyDto })
  @ApiResponse({ status: 201, description: 'Chave criada com sucesso' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  create(@User() user: JwtPayload, @Body() body: CreateModelIaKeyDto) {
    const serviceData: ServiceData<CreateModelIaKeyDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };
    return this.modelIaKeyService.create(serviceData);
  }

  @Get(':modelIaId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Listar chaves ativas de um modelo de IA' })
  @ApiParam({ name: 'modelIaId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Lista de chaves' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  findAll(@Param('modelIaId', ParseIntPipe) modelIaId: number) {
    return this.modelIaKeyService.findAll(modelIaId);
  }

  @Patch()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar chave de IA' })
  @ApiBody({ type: UpdateModelIaKeyDto })
  @ApiResponse({ status: 200, description: 'Chave atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Chave não encontrada' })
  update(@User() user: JwtPayload, @Body() body: UpdateModelIaKeyDto) {
    const serviceData: ServiceData<UpdateModelIaKeyDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };
    return this.modelIaKeyService.update(serviceData);
  }

  @Delete(':modelIaId/:modelKey')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Desativar chave de IA (soft delete)' })
  @ApiParam({ name: 'modelIaId', type: 'number' })
  @ApiParam({ name: 'modelKey', type: 'string' })
  @ApiResponse({ status: 200, description: 'Chave desativada com sucesso' })
  @ApiResponse({ status: 404, description: 'Chave não encontrada' })
  remove(
    @User() user: JwtPayload,
    @Param('modelIaId', ParseIntPipe) modelIaId: number,
    @Param('modelKey') modelKey: string,
  ) {
    const serviceData: ServiceData<DefaultModelIaKeyDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: { modelIaId, modelKey },
    };
    return this.modelIaKeyService.remove(serviceData);
  }
}
