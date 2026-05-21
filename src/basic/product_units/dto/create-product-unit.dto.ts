import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProductUnitDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ maxLength: 30 })
  @IsString()
  @MaxLength(30)
  short_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
