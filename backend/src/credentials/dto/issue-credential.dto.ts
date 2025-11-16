import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class IssueCredentialDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsObject()
  claims: Record<string, any>;
}

