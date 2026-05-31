import { PartialType } from '@nestjs/swagger';
import { CreateSalesInvoiceItemDto } from './create-sales-invoice-item.dto';

export class UpdateSalesInvoiceItemDto extends PartialType(CreateSalesInvoiceItemDto) {}
