import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.cookies?.access_token;

    if (!token) {
      throw new UnauthorizedException('Token não enviado');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      // Verificar se o usuário existe no banco de dados
      const user = await this.prisma.user.findUnique({
        where: { userId: decoded.userId },
        select: { userId: true, active: true }
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      } 

      if(user.active === false) {
        throw new UnauthorizedException('Usuário inativo');
      }

      // Verificar se o token está expirando em 5 minutos ou menos
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp! - currentTime;
      const fiveMinutesInSeconds = 5 * 60;

      if (timeUntilExpiry <= fiveMinutesInSeconds) {
        // Criar novo token com as mesmas informações
        const newToken = jwt.sign(
          { 
            userId: decoded.userId, 
            userTypeId: decoded.userTypeId,
            exp: currentTime + (60 * 60) // Novo token com 1 hora de validade
          }, 
          process.env.JWT_SECRET!
        );

        // Adicionar novo token ao cookie httpOnly
        const response = context.switchToHttp().getResponse();
        response.cookie('access_token', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 1000, // 1 hora
        });
        
        // Atualizar o decoded com o novo token
        decoded.exp = currentTime + (60 * 60);
      }

      request.user = decoded;

      return true;
    } catch (err) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}