import { Module } from '@nestjs/common';
import { PermissionGroupService } from './permission-group.service';
import { PermissionGroupController } from './permission-group.controller';
import { PermissionGroupRepository } from './permission-group.repository';

@Module({
  controllers: [PermissionGroupController],
  providers: [PermissionGroupService, PermissionGroupRepository],
  exports: [PermissionGroupService, PermissionGroupRepository],
})
export class PermissionGroupModule {}
