import { IsNotEmpty, IsObject } from 'class-validator';

export class VerifyCredentialDto {
  @IsNotEmpty()
  @IsObject()
  credential: any;
}

