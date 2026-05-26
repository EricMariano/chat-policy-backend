import { Module } from '@nestjs/common';
import { ModelIaController } from './model-ia.controller';
import { ModelIaService } from './model-ia.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ModelIaController],
  providers: [ModelIaService, PrismaService],
  exports: [ModelIaService],
})
export class ModelIaModule {}
