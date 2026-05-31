import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePurchaseOrderItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  product_id: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  product_batch_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  purchase_unit_id?: string;

  @ApiProperty({ description: 'Quantity in purchase unit' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.000001)
  quantity_purchase: number;

  @ApiProperty({ description: 'Cost per purchase unit' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unit_cost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  expected_expiry_date?: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  batch_number?: string;
}
