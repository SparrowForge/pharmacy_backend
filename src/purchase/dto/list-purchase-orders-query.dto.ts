import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListBasicQueryDto } from '../../basic/dto/list-basic-query.dto';
import { PURCHASE_ORDER_STATUSES } from './create-purchase-order.dto';

export class ListPurchaseOrdersQueryDto extends ListBasicQueryDto {
  @ApiPropertyOptional({ enum: PURCHASE_ORDER_STATUSES })
  @IsOptional()
  @IsIn(PURCHASE_ORDER_STATUSES)
  status?: (typeof PURCHASE_ORDER_STATUSES)[number];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supplier_id?: string;
}
