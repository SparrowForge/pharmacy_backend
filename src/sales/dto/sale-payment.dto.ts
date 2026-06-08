import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export const PAYMENT_STATUSES = ['pending', 'partial', 'paid', 'failed', 'refunded', 'cancelled'] as const;

export class SalePaymentDto {
  @ApiProperty({ format: 'uuid', description: 'ID from phar_payment_methods table' })
  @IsUUID()
  payment_method_id: string;

  @ApiProperty({ description: 'Amount paid via this method' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  shop_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @ApiPropertyOptional({ description: "e.g. 'cheque', 'bank_transfer', 'pos_terminal'" })
  @IsOptional()
  @IsString()
  reference_type?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'ID of the referenced document/transaction' })
  @IsOptional()
  @IsUUID()
  reference_id?: string;

  @ApiPropertyOptional({ enum: PAYMENT_STATUSES, default: 'paid' })
  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  status?: (typeof PAYMENT_STATUSES)[number];

  @ApiPropertyOptional({ format: 'date-time', description: 'When the payment was physically received' })
  @IsOptional()
  @IsDateString()
  paid_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
