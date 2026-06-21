import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { PurchasePaymentDto } from './purchase-payment.dto';

export class AddPurchasePaymentsDto {
  @ApiProperty({ type: [PurchasePaymentDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchasePaymentDto)
  payments: PurchasePaymentDto[];
}
