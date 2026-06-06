import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateSalesInvoiceItemDto } from './create-sales-invoice-item.dto';
import { SalePaymentDto } from './sale-payment.dto';

const SALES_INVOICE_STATUSES = [
  'draft',
  'completed',
  'pending',
  'cancelled',
  'returned',
] as const;

const PAYMENT_METHOD_TYPES = [
  'cash',
  'card',
  'credit',
  'mobile',
  'bank_transfer',
  'check',
  'other',
] as const;

const SALE_TYPES = ['cash', 'credit'] as const;

export class CreateSalesInvoiceDto {
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  invoice_number?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  shop_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @ApiPropertyOptional({ enum: SALES_INVOICE_STATUSES })
  @IsOptional()
  @IsIn(SALES_INVOICE_STATUSES)
  status?: (typeof SALES_INVOICE_STATUSES)[number];

  @ApiPropertyOptional({
    enum: SALE_TYPES,
    description: "'cash' auto-sets paid_amount = total. 'credit' allows partial or zero payment.",
    default: 'cash',
  })
  @IsOptional()
  @IsIn(SALE_TYPES)
  sale_type?: (typeof SALE_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount_amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tax_amount?: number;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional({
    type: [SalePaymentDto],
    description: 'Payment lines — multiple methods allowed. Replaces paid_amount when provided.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalePaymentDto)
  payments?: SalePaymentDto[];

  @ApiProperty({ type: [CreateSalesInvoiceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSalesInvoiceItemDto)
  items: CreateSalesInvoiceItemDto[];
}

export { PAYMENT_METHOD_TYPES, SALE_TYPES, SALES_INVOICE_STATUSES };
