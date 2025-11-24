import { Module, forwardRef } from '@nestjs/common';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';
import { KeyManagementService } from './key-management.service';
import { DidModule } from '../did/did.module';

@Module({
  imports: [forwardRef(() => DidModule)],
  controllers: [CredentialsController],
  providers: [CredentialsService, KeyManagementService],
  exports: [KeyManagementService],
})
export class CredentialsModule {}

