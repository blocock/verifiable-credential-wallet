import { Module, forwardRef } from '@nestjs/common';
import { DidController } from './did.controller';
import { DidService } from './did.service';
import { KeyManagementService } from '../credentials/key-management.service';

@Module({
  controllers: [DidController],
  providers: [DidService, KeyManagementService],
  exports: [DidService, KeyManagementService],
})
export class DidModule {}

