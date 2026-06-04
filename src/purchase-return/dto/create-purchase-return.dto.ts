import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreatePurchaseReturnItemDto } from '../../purchase/dto/create-purchase-return-item.dto';
import { PURCHASE_RETURN_STATUSES } from '../../purchase/dto/create-purchase-return.dto';

export class CreatePurchaseReturnDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Purchase order the return is created against',
  })
  @IsUUID()
  purchase_order_id: string;

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
