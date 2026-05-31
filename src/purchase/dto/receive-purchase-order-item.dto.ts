import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class ReceivePurchaseOrderItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  purchase_order_item_id: string;

  @ApiProperty({ description: 'Received quantity in purchase unit' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.000001)
  quantity_purchase: number;

  @ApiPropertyOptional({ description: 'Cost per purchase unit override' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unit_cost?: number;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  lot_number?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  product_batch_id?: string;
}
