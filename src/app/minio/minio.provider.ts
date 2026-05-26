import { Provider } from '@nestjs/common';
import { Client } from 'minio';
import { minioConfig } from './minio.config';

export const MinioProvider: Provider = {
    provide: 'MINIO_CONNECTION',
    useFactory: () => {
        return new Client({
            endPoint: minioConfig.endPoint,
            port: minioConfig.port,
            useSSL: minioConfig.useSSL,
            accessKey: minioConfig.accessKey,
            secretKey: minioConfig.secretKey,
        });
    },
};
