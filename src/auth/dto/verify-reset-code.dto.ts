import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class VerifyResetCodeDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @ApiProperty({ description: '6-digit password reset code' })
  @IsString()
  @Length(4, 10)
  code!: string;
}
