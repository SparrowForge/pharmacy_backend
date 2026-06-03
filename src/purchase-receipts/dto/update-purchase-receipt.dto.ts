import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { RECEIPT_STATUSES } from '../../purchase/dto/receive-purchase-order.dto';

export class UpdatePurchaseReceiptDto {
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  receipt_number?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  received_at?: string;

  @ApiPropertyOptional({ enum: RECEIPT_STATUSES })
  @IsOptional()
  @IsIn(RECEIPT_STATUSES)
  status?: (typeof RECEIPT_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
