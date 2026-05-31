import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateSalesInvoiceItemDto {
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
  sales_unit_id?: string;

  @ApiProperty({ description: 'Quantity in sales unit' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.000001)
  sales_qty: number;

  @ApiProperty({ description: 'Price per sales unit' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unit_price: number;

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
}
