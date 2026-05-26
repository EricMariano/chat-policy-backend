import { Module } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import { RedisService } from '../redis/redis.service';
import { RedisProvider } from '../redis/redis.provider';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports:[
        RedisModule
    ],
  providers: [
    RedisProvider,
    QueueService,
    RedisService
  ],
  exports: [
    QueueService
  ],
})
export class QueueModule {}
