import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TeamsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || '';
    const token = authHeader.replace('HMAC ', '').replace('Bearer ', '').trim();
    const secret = process.env.TEAMS_WEBHOOK_SECRET;

    console.log('=== GUARD DEBUG ===');
    console.log('Token recebido:', token);
    console.log('Secret configurado:', secret ? 'SIM' : 'NÃO');

    if (!secret) {
      throw new UnauthorizedException('TEAMS_WEBHOOK_SECRET não configurado.');
    }

    if (!token) {
      throw new UnauthorizedException('Token ausente.');
    }

    try {
      const msgBuf = Buffer.from(request.rawBody ?? JSON.stringify(request.body), 'utf8');
      const secretBuf = Buffer.from(secret, 'base64');

      const expected = crypto
        .createHmac('sha256', secretBuf)
        .update(msgBuf)
        .digest('base64');

      console.log('Token esperado:', expected);
      console.log('Match:', token === expected);

      if (token !== expected) {
        throw new UnauthorizedException('Token inválido.');
      }

      return true;
    } catch (err) {
      console.log('Erro no guard:', err);
      throw new UnauthorizedException('Erro na validação do token.');
    }
  }
}