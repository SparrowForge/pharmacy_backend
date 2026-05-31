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
import { CreatePurchaseOrderItemDto } from './create-purchase-order-item.dto';

const PURCHASE_ORDER_STATUSES = ['pending', 'confirmed', 'received', 'partial', 'cancelled'] as const;
const PAYMENT_STATUSES = ['pending', 'partial', 'paid', 'failed', 'refunded', 'cancelled'] as const;

export class CreatePurchaseOrderDto {
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  po_number?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  supplier_id: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  shop_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @ApiPropertyOptional({ enum: PURCHASE_ORDER_STATUSES })
  @IsOptional()
  @IsIn(PURCHASE_ORDER_STATUSES)
  status?: (typeof PURCHASE_ORDER_STATUSES)[number];

  @ApiPropertyOptional({ enum: PAYMENT_STATUSES })
  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  phar_payment_status?: (typeof PAYMENT_STATUSES)[number];

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
  shipping_cost?: number;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  expected_delivery_date?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  delivery_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreatePurchaseOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}

export { PAYMENT_STATUSES, PURCHASE_ORDER_STATUSES };
