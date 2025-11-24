import { Module } from '@nestjs/common';
import { CredentialsModule } from './credentials/credentials.module';
import { DidModule } from './did/did.module';

@Module({
  imports: [CredentialsModule, DidModule],
})
export class AppModule {}

