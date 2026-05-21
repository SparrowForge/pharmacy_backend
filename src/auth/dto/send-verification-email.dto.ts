import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class SendVerificationEmailDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(160)
  email!: string;
}
