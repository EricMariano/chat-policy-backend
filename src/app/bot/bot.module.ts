import { Module } from '@nestjs/common';
import { MessageModule } from '../message/message.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';

@Module({
  imports: [MessageModule, PrismaModule, RedisModule],
  controllers: [BotController],
  providers: [BotService],
})
export class BotModule {}
