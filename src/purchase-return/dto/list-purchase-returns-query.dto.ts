import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListBasicQueryDto } from '../../basic/dto/list-basic-query.dto';
import { PURCHASE_RETURN_STATUSES } from '../../purchase/dto/create-purchase-return.dto';

export class ListPurchaseReturnsQueryDto extends ListBasicQueryDto {
  @ApiPropertyOptional({ enum: PURCHASE_RETURN_STATUSES })
  @IsOptional()
  @IsIn(PURCHASE_RETURN_STATUSES)
  status?: (typeof PURCHASE_RETURN_STATUSES)[number];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supplier_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  purchase_order_id?: string;
}
