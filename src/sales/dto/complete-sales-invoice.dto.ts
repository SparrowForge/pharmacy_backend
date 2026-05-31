import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CompleteSalesInvoiceDto {
  @ApiPropertyOptional({ description: 'Override paid amount before completion' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  paid_amount?: number;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  invoice_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
