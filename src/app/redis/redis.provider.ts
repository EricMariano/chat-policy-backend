import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { redisConfig } from './redis.config';

export const RedisProvider: Provider = {
  provide: 'REDIS_CONNECTION',
  useFactory: () => {
    return new Redis(redisConfig);
  },
};