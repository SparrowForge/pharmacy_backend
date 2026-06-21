import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class PaymentReportQueryDto {
  @ApiPropertyOptional({ description: 'Range start date (inclusive), format YYYY-MM-DD', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Range end date (inclusive), format YYYY-MM-DD', example: '2026-01-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by supplier or customer company' })
  @IsOptional()
  @IsUUID()
  company_id?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by payment method' })
  @IsOptional()
  @IsUUID()
  payment_method_id?: string;

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
