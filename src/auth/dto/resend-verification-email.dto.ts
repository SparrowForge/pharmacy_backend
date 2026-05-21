import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class ResendVerificationEmailDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(160)
  email!: string;
}
