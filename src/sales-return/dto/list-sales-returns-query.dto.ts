import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListBasicQueryDto } from '../../basic/dto/list-basic-query.dto';
import { SALES_RETURN_STATUSES } from './create-sales-return.dto';

export class ListSalesReturnsQueryDto extends ListBasicQueryDto {
  @ApiPropertyOptional({ enum: SALES_RETURN_STATUSES })
  @IsOptional()
  @IsIn(SALES_RETURN_STATUSES)
  status?: (typeof SALES_RETURN_STATUSES)[number];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sales_invoice_id?: string;
}
