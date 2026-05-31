import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { ReceivePurchaseOrderItemDto } from './receive-purchase-order-item.dto';

const RECEIPT_STATUSES = ['draft', 'received', 'partial', 'cancelled'] as const;

export class ReceivePurchaseOrderDto {
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  receipt_number?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  received_at?: string;

  @ApiPropertyOptional({ enum: RECEIPT_STATUSES })
  @IsOptional()
  @IsIn(RECEIPT_STATUSES)
  status?: (typeof RECEIPT_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [ReceivePurchaseOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseOrderItemDto)
  items: ReceivePurchaseOrderItemDto[];
}

export { RECEIPT_STATUSES };
