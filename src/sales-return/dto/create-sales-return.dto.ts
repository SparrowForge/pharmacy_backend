import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateSalesReturnItemDto } from './create-sales-return-item.dto';

export const SALES_RETURN_STATUSES = ['completed', 'pending', 'cancelled'] as const;

export class CreateSalesReturnDto {
  @ApiProperty({
    format: 'uuid',
    description: 'The completed sales invoice this return is created against',
  })
  @IsUUID()
  sales_invoice_id: string;

  @ApiPropertyOptional({
    maxLength: 80,
    description: 'Return number — auto-generated if omitted',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  return_number?: string;

  @ApiPropertyOptional({
    enum: SALES_RETURN_STATUSES,
    default: 'completed',
  })
  @IsOptional()
  @IsIn(SALES_RETURN_STATUSES)
  status?: (typeof SALES_RETURN_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Overall reason for the return' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ format: 'date-time', description: 'Return date — defaults to now' })
  @IsOptional()
  @IsDateString()
  return_date?: string;

  @ApiProperty({ type: [CreateSalesReturnItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSalesReturnItemDto)
  items: CreateSalesReturnItemDto[];
}
