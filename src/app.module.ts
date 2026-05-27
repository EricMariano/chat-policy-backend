import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './app/prisma/prisma.module';
import { UserModule } from './app/user/user.module';
import { DepartmentModule } from './app/department/department.module';
import { SystemModule } from './app/system/system.module';
import { RedisModule } from './app/redis/redis.module';
import { DocumentsModule } from './app/documents/documents.module';
import { ChatModule } from './app/chat/chat.module';
import { MessageModule } from './app/message/message.module';
import { QueueModule } from './app/queue/queue.module';
import { ModelIaModule } from './app/model-ia/model-ia.module';
import { ModelIaKeyModule } from './app/model-ia-key/model-ia-key.module';
import { PermissionGroupModule } from './app/permission-group/permission-group.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UserModule,
    DepartmentModule,
    SystemModule,
    RedisModule,
    DocumentsModule,
    ChatModule,
    MessageModule,
    QueueModule,
    ModelIaModule,
    ModelIaKeyModule,
    PermissionGroupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
