import { Module } from '@nestjs/common';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';
import { KeyManagementService } from './key-management.service';

@Module({
  controllers: [CredentialsController],
  providers: [CredentialsService, KeyManagementService],
})
export class CredentialsModule {}

