import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { CreatePurchaseReturnItemDto } from './create-purchase-return-item.dto';

const PURCHASE_RETURN_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'completed',
  'cancelled',
] as const;

export class CreatePurchaseReturnDto {
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  return_number?: string;

  @ApiPropertyOptional({ enum: PURCHASE_RETURN_STATUSES })
  @IsOptional()
  @IsIn(PURCHASE_RETURN_STATUSES)
  status?: (typeof PURCHASE_RETURN_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreatePurchaseReturnItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseReturnItemDto)
  items: CreatePurchaseReturnItemDto[];
}

export { PURCHASE_RETURN_STATUSES };
