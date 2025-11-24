import { Controller, Get, Param } from '@nestjs/common';
import { DidService } from './did.service';

@Controller('.well-known')
export class DidController {
  constructor(private readonly didService: DidService) {}

  @Get('did.json')
  getDidDocument() {
    return this.didService.generateDidDocument();
  }
}

