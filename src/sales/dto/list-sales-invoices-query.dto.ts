import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListBasicQueryDto } from '../../basic/dto/list-basic-query.dto';
import { SALES_INVOICE_STATUSES } from './create-sales-invoice.dto';

export class ListSalesInvoicesQueryDto extends ListBasicQueryDto {
  @ApiPropertyOptional({ enum: SALES_INVOICE_STATUSES })
  @IsOptional()
  @IsIn(SALES_INVOICE_STATUSES)
  status?: (typeof SALES_INVOICE_STATUSES)[number];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customer_id?: string;
}
