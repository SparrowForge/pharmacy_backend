import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePurchaseReturnItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  purchase_order_item_id: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  product_batch_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  return_unit_id?: string;

  @ApiProperty({ description: 'Return quantity in return unit' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.000001)
  return_qty: number;

  @ApiPropertyOptional({ description: 'Cost per return unit override' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unit_cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
