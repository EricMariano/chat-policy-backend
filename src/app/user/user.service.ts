import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login.dto';
import { ServiceData } from '../types/general';
import { JwtPayload } from '../types/jwt';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUserByEmailDto } from './dto/find-user-by-email.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UserRepository } from './user.repository';
import { UserByEmailResponse, UserFilterResponse } from './user.type';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
  ) {}

  async create(data: ServiceData<CreateUserDto>) {
    const { bodyData: createUserDto } = data;
    const existingUser = await this.prisma.user.findFirst({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
        typeUserId: createUserDto.typeUserId,
      },
      select: {
        userId: true,
        name: true,
        email: true,
        typeUserId: true,
        registeredAt: true,
        active: true,
      },
    });

    return user;
  }

  async login(data: LoginUserDto) {
    const loginUserDto = data;

    const user = await this.prisma.user.findFirst({
      where: { email: loginUserDto.email },
      select: {
        userId: true,
        name: true,
        email: true,
        password: true,
        typeUserId: true,
        active: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Não existe nenhum usuario registrado com esse email');
    }

    if (!user.active) {
      throw new UnauthorizedException('Usuário inativo');
    }

    const isPasswordValid = await bcrypt.compare(loginUserDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const payload: JwtPayload = {
      userId: user.userId,
      userTypeId: user.typeUserId,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async findAll() {
    return await this.prisma.user.findMany({
      where: { active: true },
      select: {
        userId: true,
        name: true,
        email: true,
        typeUserId: true,
        registeredAt: true,
        active: true,
        typeUser: {
          select: {
            typeUserId: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(data: ServiceData<number>) {
    const userId = data.bodyData;
    
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        name: true,
        email: true,
        typeUserId: true,
        registeredAt: true,
        active: true,
        typeUser: {
          select: {
            typeUserId: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async update(data: ServiceData<UpdateUserDto>) {
    let userId = 0;

    if(data.typeUserId === 1 && data.bodyData.userId) {
      userId = data.bodyData.userId;
    }else {
      userId = data.userId
    }

    const updateData = data.bodyData;
    
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: updateData.email },
      });

      if (existingUser) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    const dataToUpdate: any = {
      name: updateData.name,
      email: updateData.email,
      typeUserId: updateData.typeUserId,
    };

    const updatedUser = await this.prisma.user.update({
      where: { userId },
      data: dataToUpdate,
      select: {
        userId: true,
        name: true,
        email: true,
        typeUserId: true,
        registeredAt: true,
        active: true,
      },
    });

    return updatedUser;
  }

  async remove(data: ServiceData<number>) {
    const userId = data.bodyData;
    
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.prisma.user.update({
      where: { userId },
      data: { active: false },
    });

    return { message: 'Usuário desativado com sucesso' };
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findFirst({
      where: { email, active: true },
    });
  }

  async findUserByEmail(data: ServiceData<FindUserByEmailDto>): Promise<UserByEmailResponse[]> {
    const { bodyData } = data;
    const { email } = bodyData;

    return await this.userRepository.findByEmail(email);
  }

  async filterUsers(data: ServiceData<FilterUsersDto>): Promise<{data:UserFilterResponse[],pages:number}> {
    const { bodyData } = data;
    const { active, name, limit, currentPage } = bodyData;

    const offset = (currentPage - 1) * limit;

    const count = await this.userRepository.countUsersWithFilters({
      active,
      name,
    });

    const users = await this.userRepository.findUsersWithFilters({
      active,
      name,
      limit,
      offset,
    });

    const totalUsers = Number(count.totalUsers);
    const pages = Math.ceil(totalUsers / limit);

    return {
      data: users,
      pages,
    };
  }
}
