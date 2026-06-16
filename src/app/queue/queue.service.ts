import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JobDocumentDto } from '../documents/dto/job.document.dto';
import { DefaultMessageDto } from '../message/dto/default-message.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private documentQueue!: Queue;
  private messageQueue!: Queue;

  constructor(
    private readonly redisService: RedisService,
  ) {}

  onModuleInit(): void {
    const redis = this.redisService.getClient();

    this.documentQueue = new Queue('document', {
      connection: redis,
    });

    this.messageQueue = new Queue('message', {
      connection: redis,
    });

    this.logger.log('QueueService initialized with BullMQ queues');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing BullMQ queues...');
    await this.documentQueue.close();
    await this.messageQueue.close();
    this.logger.log('BullMQ queues closed');
  }

  async addProcessMessageJob(data: DefaultMessageDto, departmentsIds:number[],systemsIds:number[],chatModel:string, apiKey:string) {
    await this.messageQueue.add('process-message', {...data,departmentsIds,systemsIds,chatModel, apiKey}, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
    
  }

  async addProcessDocumentJob(data: JobDocumentDto) {
    await this.documentQueue.add('process-document', data, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async addProcessUpdateDocumentJob(data: JobDocumentDto) {
    await this.documentQueue.add('process-update-document', data, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

}