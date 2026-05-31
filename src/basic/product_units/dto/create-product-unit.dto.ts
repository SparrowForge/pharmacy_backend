import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export const PRODUCT_UNIT_TYPES = [
  'Weight',
  'Height',
  'Volume',
  'Area',
  'Pieaces',
] as const;

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

  @ApiPropertyOptional({ enum: PRODUCT_UNIT_TYPES })
  @IsOptional()
  @IsString()
  @IsIn(PRODUCT_UNIT_TYPES)
  unit_type?: (typeof PRODUCT_UNIT_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_deafult_unit?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  convert_rate?: number;
}
