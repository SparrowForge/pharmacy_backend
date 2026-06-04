import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreatePurchaseReturnItemDto } from '../../purchase/dto/create-purchase-return-item.dto';
import { PURCHASE_RETURN_STATUSES } from '../../purchase/dto/create-purchase-return.dto';

export class UpdatePurchaseReturnDto {
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

  @ApiPropertyOptional({
    type: [CreatePurchaseReturnItemDto],
    description:
      'When provided, fully replaces the return lines. Existing stock effects are reversed and the new lines are re-applied.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseReturnItemDto)
  items?: CreatePurchaseReturnItemDto[];
}
