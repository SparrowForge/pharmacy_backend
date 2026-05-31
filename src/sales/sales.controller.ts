import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AddSalesInvoiceItemDto } from './dto/add-sales-invoice-item.dto';
import { CompleteSalesInvoiceDto } from './dto/complete-sales-invoice.dto';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto';
import { ListSalesInvoicesQueryDto } from './dto/list-sales-invoices-query.dto';
import { UpdateSalesInvoiceItemDto } from './dto/update-sales-invoice-item.dto';
import { UpdateSalesInvoiceDto } from './dto/update-sales-invoice.dto';
import { SalesService } from './sales.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string;
  };
};

@ApiTags('SalesInvoices')
@Controller('sales_invoices')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @ApiOperation({ summary: 'List sales invoices' })
  list(@Query() query: ListSalesInvoicesQueryDto) {
    return this.salesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create sales invoice with items' })
  create(@Body() dto: CreateSalesInvoiceDto, @Req() req: AuthenticatedRequest) {
    return this.salesService.create(dto, req.user?.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales invoice details by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.salesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sales invoice header by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSalesInvoiceDto,
  ) {
    return this.salesService.update(id, dto);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to sales invoice' })
  addItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddSalesInvoiceItemDto,
  ) {
    return this.salesService.addItem(id, dto);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Update sales invoice item' })
  updateItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdateSalesInvoiceItemDto,
  ) {
    return this.salesService.updateItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Delete sales invoice item' })
  removeItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ) {
    return this.salesService.removeItem(id, itemId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete sales invoice and deduct stock' })
  complete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CompleteSalesInvoiceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.salesService.complete(id, dto, req.user?.sub);
  }
}
