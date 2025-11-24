import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { IssueCredentialDto } from './dto/issue-credential.dto';
import { VerifyCredentialDto } from './dto/verify-credential.dto';

@Controller('credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post('issue')
  @HttpCode(HttpStatus.CREATED)
  issueCredential(@Body() dto: IssueCredentialDto) {
    return this.credentialsService.issueCredential(dto);
  }

  @Get()
  findAll() {
    return this.credentialsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const credential = this.credentialsService.findOne(id);
    if (!credential) {
      return { error: 'Credential not found' };
    }
    return credential;
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyCredential(@Body() dto: VerifyCredentialDto) {
    return await this.credentialsService.verifyCredential(dto.credential);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    const deleted = this.credentialsService.remove(id);
    return { success: deleted, message: deleted ? 'Credential deleted' : 'Credential not found' };
  }
}

