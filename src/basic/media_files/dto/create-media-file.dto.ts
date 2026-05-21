import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMediaFileDto {
  @ApiProperty()
  @IsString()
  file_name: string;

  @ApiProperty()
  @IsString()
  file_url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  file_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mime_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  file_size?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alt_text?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  uploaded_by?: string;
}
