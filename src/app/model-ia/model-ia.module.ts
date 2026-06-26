import { Module } from '@nestjs/common';
import { ModelIaController } from './model-ia.controller';
import { ModelIaService } from './model-ia.service';
import { PrismaService } from '../prisma/prisma.service';
import { ModelIaRepository } from './model-ia.repository';

@Module({
  controllers: [ModelIaController],
  providers: [ModelIaService, ModelIaRepository, PrismaService],
  exports: [ModelIaService],
})
export class ModelIaModule {}
