import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadMediaFileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alt_text?: string;
}
