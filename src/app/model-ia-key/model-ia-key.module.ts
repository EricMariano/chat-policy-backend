import { Module } from '@nestjs/common';
import { ModelIaKeyController } from './model-ia-key.controller';
import { ModelIaKeyService } from './model-ia-key.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ModelIaKeyController],
  providers: [ModelIaKeyService, PrismaService],
  exports: [ModelIaKeyService],
})
export class ModelIaKeyModule {}
