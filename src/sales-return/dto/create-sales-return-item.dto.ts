import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateSalesReturnItemDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Reference to the original sales invoice item being returned',
  })
  @IsUUID()
  sales_invoice_item_id: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Return unit override — defaults to the original sales unit on the invoice item',
  })
  @IsOptional()
  @IsUUID()
  return_unit_id?: string;

  @ApiProperty({ description: 'Return quantity in the return unit', minimum: 0.000001 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.000001)
  return_qty: number;

  @ApiPropertyOptional({
    description: 'Unit price override for the return — defaults to original invoice item price',
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unit_price?: number;

  @ApiPropertyOptional({ description: 'Reason for returning this item' })
  @IsOptional()
  @IsString()
  reason?: string;
}
