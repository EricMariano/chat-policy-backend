import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Client } from 'minio';
import { minioConfig } from './minio.config';

@Injectable()
export class MinioService implements OnModuleInit {
    private readonly logger = new Logger(MinioService.name);
    private readonly bucketName: string;

    constructor(
        @Inject('MINIO_CONNECTION') private readonly minioClient: Client,
    ) {
        this.bucketName = minioConfig.bucketName;
    }

    async onModuleInit(): Promise<void> {
        await this.ensureBucketExists();
        this.logger.log('MinIO service initialized');
    }

    private async ensureBucketExists(): Promise<void> {
        try {
            const bucketExists = await this.minioClient.bucketExists(this.bucketName);
            if (!bucketExists) {
                await this.minioClient.makeBucket(this.bucketName);
            } else {
                this.logger.log(`Bucket '${this.bucketName}' already exists`);
            }
        } catch (error) {
            this.logger.error('Error checking/creating bucket:', error);
            throw error;
        }
    }

    async uploadFile(
        objectName: string,
        fileBuffer: Buffer,
        mimeType: string,
        metadata?: Record<string, string>,
    ): Promise<string> {
        try {
            await this.minioClient.putObject(
                this.bucketName,
                objectName,
                fileBuffer,
                fileBuffer.length,
                {
                    'Content-Type': mimeType,
                    ...metadata,
                },
            );
            this.logger.log(`File '${objectName}' uploaded successfully`);
            return objectName;
        } catch (error) {
            this.logger.error(`Error uploading file '${objectName}':`, error);
            throw error;
        }
    }

    async getFile(objectName: string): Promise<Buffer> {
        try {
            const stream = await this.minioClient.getObject(this.bucketName, objectName);
            const chunks: Buffer[] = [];

            return new Promise((resolve, reject) => {
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });
        } catch (error) {
            this.logger.error(`Error getting file '${objectName}':`, error);
            throw error;
        }
    }

    async getPresignedUrl(objectName: string, expirySeconds: number = 3600): Promise<string> {
        try {
            return await this.minioClient.presignedGetObject(
                this.bucketName,
                objectName,
                expirySeconds,
            );
        } catch (error) {
            this.logger.error(`Error generating presigned URL for '${objectName}':`, error);
            throw error;
        }
    }

    async deleteFile(objectName: string): Promise<void> {
        try {
            await this.minioClient.removeObject(this.bucketName, objectName);
            this.logger.log(`File '${objectName}' deleted successfully`);
        } catch (error) {
            this.logger.error(`Error deleting file '${objectName}':`, error);
            throw error;
        }
    }

    async fileExists(objectName: string): Promise<boolean> {
        try {
            await this.minioClient.statObject(this.bucketName, objectName);
            return true;
        } catch {
            return false;
        }
    }

    async listFiles(prefix?: string): Promise<string[]> {
        try {
            const objects: string[] = [];
            const stream = this.minioClient.listObjects(this.bucketName, prefix || '', true);

            return new Promise((resolve, reject) => {
                stream.on('data', (obj) => {
                    if (obj.name) objects.push(obj.name);
                });
                stream.on('end', () => resolve(objects));
                stream.on('error', reject);
            });
        } catch (error) {
            this.logger.error('Error listing files:', error);
            throw error;
        }
    }

    getBucketName(): string {
        return this.bucketName;
    }
}
