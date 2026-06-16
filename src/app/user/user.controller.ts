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
  Res,
  Query,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUserByEmailDto } from './dto/find-user-by-email.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { ServiceData } from '../types/general';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../role';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { User } from '../user';
import { type JwtPayload } from '../types/jwt';
import { UserRole } from './user.enum';
import { LoginUserDto } from './dto/login.dto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiBody({
    type: CreateUserDto,
    description: 'Cria usuário e, opcionalmente, vincula aos grupos de permissão informados em permissionGroupIds',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  create(@Body() createUserDto: CreateUserDto) {
    const serviceData: ServiceData<CreateUserDto> = {
      userId: 0,
      typeUserId: 0,
      bodyData: createUserDto
    };
    return this.userService.create(serviceData);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login de usuário' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginUserDto: LoginUserDto, @Res({ passthrough: true }) res: Response,) {
    const result = await this.userService.login(loginUserDto);
    
    res.cookie('access_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hora
    });
    
    const { token, ...userData } = result;
    return userData;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout de usuário' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  logout(@Res({ passthrough: true }) res: Response,) {
    res.clearCookie('access_token');
    return { message: 'Logout realizado com sucesso' };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários ativos' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({ status: 200, description: 'Lista de usuários' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  findOne(@User() user:JwtPayload,@Param('id', ParseIntPipe) id: number) {
    const serviceData: ServiceData<number> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: id
    };
    return this.userService.findOne(serviceData);
  }

  @Patch()
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.USER)
  update(
    @User() user:JwtPayload,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const serviceData: ServiceData<UpdateUserDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: updateUserDto
    };
    return this.userService.update(serviceData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({name: 'id', type: 'number'})
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.USER)
  @ApiOperation({ summary: 'Desativar usuário (soft delete)' })
  @ApiResponse({ status: 200, description: 'Usuário desativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    const serviceData: ServiceData<number> = {
      userId: id,
      typeUserId: 0,
      bodyData: id
    };
    return this.userService.remove(serviceData);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Buscar usuário por email' })
  @ApiParam({ name: 'email', description: 'Email do usuário' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findUserByEmail(
    @User() user: JwtPayload,
    @Param() query: FindUserByEmailDto,
  ) {

    const serviceData: ServiceData<FindUserByEmailDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: query,
    };

    return await this.userService.findUserByEmail(serviceData);

  }

  @Get('pagination')
  @ApiOperation({ summary: 'Filtrar usuários' })
  @ApiQuery({ name: 'active', required: false, description: 'Filtro de status ativo/desativo' })
  @ApiQuery({ name: 'name', required: false, description: 'Filtro de nome (busca parcial)' })
  @ApiQuery({ name: 'userType', required: false, description: 'Filtro por tipo de usuário' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados (1-100, padrão: 10)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginação (padrão: 0)' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiResponse({ status: 200, description: 'Usuários filtrados com sucesso' })
  async filterUsers(
    @User() user: JwtPayload,
    @Query() query: FilterUsersDto,
  ) {
    const serviceData: ServiceData<FilterUsersDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: query,
    };
    return await this.userService.filterUsers(serviceData);
  }
}
