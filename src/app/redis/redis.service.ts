import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly subscriber: Redis;

  constructor(
    @Inject('REDIS_CONNECTION') private readonly redis: Redis,
  ) {
    this.subscriber = redis.duplicate();
  }

  async onModuleInit(): Promise<void> {
    this.redis.on('connect', () => {
      this.logger.log('Redis connection established');
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error', err);
    });

    await this.checkHealth();
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing Redis connections...');
    await this.redis.quit();
    await this.subscriber.quit();
    this.logger.log('Redis connections closed');
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      throw error;
    }
  }

  getClient(): Redis {
    return this.redis;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  async publish(channel: string, message: unknown): Promise<void> {
    const serialized = typeof message === 'string' ? message : JSON.stringify(message);
    await this.redis.publish(channel, serialized);
  }

  async subscribe(
    channel: string,
    callback: (message: string, channel: string) => void,
  ): Promise<void> {
    this.subscriber.subscribe(channel);
    this.subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(message, receivedChannel);
      }
    });
  }

  async unsubscribe(channel?: string): Promise<void> {
    if (channel) {
      await this.subscriber.unsubscribe(channel);
    } else {
      await this.subscriber.unsubscribe();
    }
  }
}
