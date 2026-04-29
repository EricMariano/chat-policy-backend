import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Put,
} from '@nestjs/common';
import { SystemService } from './system.service.js';
import { CreateSystemDto } from './dto/create-system.dto.js';
import { UpdateSystemDto } from './dto/update-system.dto.js';
import { ServiceData } from '../types/general.js';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { DefaultSystemDto } from './dto/default-system.dto.js';
import { AuthGuard } from '../guards/auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { UserRole } from '../user/user.enum.js';
import { Roles } from '../role.js';
import { User } from '../user.js';
import {type JwtPayload } from '../types/jwt.js';

@ApiTags('Systems')
@Controller('systems')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo sistema' })
  @ApiBody({ type: CreateSystemDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({ status: 201, description: 'Sistema criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Sistema já existe' })
  create(@User() user:JwtPayload, @Body() createSystemDto: CreateSystemDto) {
    const serviceData: ServiceData<CreateSystemDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: createSystemDto
    };
    return this.systemService.create(serviceData);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os sistemas ativos' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.USER)
  @ApiResponse({ status: 200, description: 'Lista de sistemas' })
  findAll(@User() user:JwtPayload) {
    const serviceData: ServiceData<null> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: null
    };
    return this.systemService.findAll(serviceData);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar sistema por ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.USER)
  @ApiResponse({ status: 200, description: 'Sistema encontrado' })
  @ApiResponse({ status: 404, description: 'Sistema não encontrado' })
  findOne(@User() user:JwtPayload,@Param('id', ParseIntPipe) id: number) {
    const serviceData: ServiceData<DefaultSystemDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: {systemId:id}
    };
    return this.systemService.findOne(serviceData);
  }

  @Put()
  @ApiOperation({ summary: 'Atualizar sistema' })
  @ApiBody({ type: UpdateSystemDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({ status: 200, description: 'Sistema atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Sistema não encontrado' })
  @ApiResponse({ status: 409, description: 'Sistema já existe' })
  update(
    @User() user:JwtPayload,
    @Body() updateSystemDto: UpdateSystemDto,
  ) {
    const serviceData: ServiceData<UpdateSystemDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: updateSystemDto
    };
    return this.systemService.update(serviceData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar sistema' })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({ status: 200, description: 'Sistema desativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Sistema não encontrado' })
  remove(@User() user:JwtPayload, @Param('id', ParseIntPipe) id: number) {
    const serviceData: ServiceData<DefaultSystemDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: {systemId:id}
    };
    return this.systemService.remove(serviceData);
  }
}
