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
import { CreateSalesReturnItemDto } from './create-sales-return-item.dto';
import { SALES_RETURN_STATUSES } from './create-sales-return.dto';

export class UpdateSalesReturnDto {
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  return_number?: string;

  @ApiPropertyOptional({ enum: SALES_RETURN_STATUSES })
  @IsOptional()
  @IsIn(SALES_RETURN_STATUSES)
  status?: (typeof SALES_RETURN_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    type: [CreateSalesReturnItemDto],
    description:
      'When provided, fully replaces the return lines. Existing stock effects are reversed and new lines are re-applied.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSalesReturnItemDto)
  items?: CreateSalesReturnItemDto[];
}
