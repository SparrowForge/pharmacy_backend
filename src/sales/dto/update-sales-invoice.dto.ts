import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSalesInvoiceDto } from './create-sales-invoice.dto';

export class UpdateSalesInvoiceDto extends PartialType(
  OmitType(CreateSalesInvoiceDto, ['items'] as const),
) {}
