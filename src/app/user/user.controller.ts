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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ServiceData } from '../types/general';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
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
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiBody({ type: CreateUserDto })
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
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
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
}
