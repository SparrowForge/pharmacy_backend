import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { ReceivePurchaseOrderDto } from '../../purchase/dto/receive-purchase-order.dto';

export class CreatePurchaseReceiptDto extends ReceivePurchaseOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  purchase_order_id: string;
}
