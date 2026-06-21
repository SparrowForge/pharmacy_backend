import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class PurchaseReportQueryDto {
  @ApiProperty({ description: 'Range start date (inclusive), format YYYY-MM-DD', example: '2026-01-01' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'Range end date (inclusive), format YYYY-MM-DD', example: '2026-01-31' })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by supplier (company)' })
  @IsOptional()
  @IsUUID()
  supplier_id?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by product category' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by a single product' })
  @IsOptional()
  @IsUUID()
  product_id?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
