import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentReportQueryDto } from './dto/payment-report-query.dto';
import { PurchaseReportQueryDto } from './dto/purchase-report-query.dto';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';
import { StatementQueryDto } from './dto/statement-query.dto';
import { StockReportQueryDto } from './dto/stock-report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stock')
  @ApiOperation({
    summary: 'Stock movement report',
    description:
      'Returns opening stock, received qty, purchase-return qty, sales qty, sales-return qty, and closing stock per product over a date range. ' +
      'Figures are derived from `phar_stock_movements`. Optionally filter by category or a single product.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Report rows plus aggregate totals. Each row represents one product.',
  })
  @ApiResponse({ status: 400, description: 'start_date is after end_date, or invalid query params.' })
  stock(@Query() query: StockReportQueryDto) {
    return this.reportsService.stockReport(query);
  }

  @Get('purchases')
  @ApiOperation({
    summary: 'Purchase line-item report',
    description:
      'Returns one row per purchase-order item within the date range. ' +
      'Columns: `date`, `po_number`, `supplier_name`, `product_name`, `category_name`, `purchase_qty`, `unit_cost`, `purchase_amount`. ' +
      'Optional filters: `supplier_id` (company), `category_id`, `product_id`. ' +
      'Response includes page-level `totals.total_qty` and `totals.total_amount`.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated purchase line items with aggregate totals.',
  })
  @ApiResponse({ status: 400, description: 'start_date is after end_date, or invalid query params.' })
  purchases(@Query() query: PurchaseReportQueryDto) {
    return this.reportsService.purchaseReport(query);
  }

  @Get('sales')
  @ApiOperation({
    summary: 'Sales line-item report',
    description:
      'Returns one row per completed sales-invoice item within the date range. ' +
      'Columns: `date`, `invoice_number`, `customer_name`, `product_name`, `category_name`, `sales_qty`, `unit_price`, `sales_amount`. ' +
      'Optional filters: `customer_id` (company), `category_id`, `product_id`. ' +
      'Response includes page-level `totals.total_qty` and `totals.total_amount`.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated sales line items with aggregate totals.',
  })
  @ApiResponse({ status: 400, description: 'start_date is after end_date, or invalid query params.' })
  sales(@Query() query: SalesReportQueryDto) {
    return this.reportsService.salesReport(query);
  }

  @Get('suppliers/:supplierId/statement')
  @ApiOperation({
    summary: 'Supplier account statement',
    description:
      'Chronological ledger for a single supplier. Each row is one of three transaction types:\n' +
      '- `purchase` — debit entry (amount owed to supplier)\n' +
      '- `payment` — credit entry (payment made to supplier)\n' +
      '- `return` — credit entry (purchase-return reduces the balance)\n\n' +
      'The `balance` field on each row is the running net balance (debit − credit). ' +
      'Response also includes `totals.total_debit`, `totals.total_credit`, and `totals.closing_balance`. ' +
      'Optionally filter to a date range using `start_date` / `end_date`.',
  })
  @ApiParam({ name: 'supplierId', format: 'uuid', description: 'ID of the supplier company' })
  @ApiResponse({
    status: 200,
    description: 'Ordered list of ledger entries with running balance and summary totals.',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID or query params.' })
  supplierStatement(
    @Param('supplierId', new ParseUUIDPipe()) supplierId: string,
    @Query() query: StatementQueryDto,
  ) {
    return this.reportsService.supplierStatement(supplierId, query);
  }

  @Get('customers/:customerId/statement')
  @ApiOperation({
    summary: 'Customer account statement',
    description:
      'Chronological ledger for a single customer. Each row is one of three transaction types:\n' +
      '- `sale` — debit entry (amount owed by customer)\n' +
      '- `payment` — credit entry (payment received from customer)\n' +
      '- `return` — credit entry (sales-return reduces the balance)\n\n' +
      'The `balance` field on each row is the running net balance (debit − credit). ' +
      'Response also includes `totals.total_debit`, `totals.total_credit`, and `totals.closing_balance`. ' +
      'Optionally filter to a date range using `start_date` / `end_date`.',
  })
  @ApiParam({ name: 'customerId', format: 'uuid', description: 'ID of the customer company' })
  @ApiResponse({
    status: 200,
    description: 'Ordered list of ledger entries with running balance and summary totals.',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID or query params.' })
  customerStatement(
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Query() query: StatementQueryDto,
  ) {
    return this.reportsService.customerStatement(customerId, query);
  }

  @Get('supplier-payments')
  @ApiOperation({
    summary: 'Supplier payment report',
    description:
      'Lists all payments made to suppliers (`phar_purchase_payments`). ' +
      'Optional filters: `start_date`, `end_date`, `company_id` (supplier), `payment_method_id`. ' +
      'Each row includes `payment_number`, `supplier_name`, `po_number`, `payment_method_name`, `amount`, `status`, `paid_at`. ' +
      'Response includes `total_amount` across the current page.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of supplier payments with a page total.',
  })
  @ApiResponse({ status: 400, description: 'Invalid query params.' })
  supplierPayments(@Query() query: PaymentReportQueryDto) {
    return this.reportsService.supplierPaymentReport(query);
  }

  @Get('customer-payments')
  @ApiOperation({
    summary: 'Customer payment report',
    description:
      'Lists all payments received from customers (`phar_sale_payments`). ' +
      'Optional filters: `start_date`, `end_date`, `company_id` (customer), `payment_method_id`. ' +
      'Each row includes `payment_number`, `customer_name`, `invoice_number`, `payment_method_name`, `amount`, `status`, `paid_at`. ' +
      'Response includes `total_amount` across the current page.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of customer payments with a page total.',
  })
  @ApiResponse({ status: 400, description: 'Invalid query params.' })
  customerPayments(@Query() query: PaymentReportQueryDto) {
    return this.reportsService.customerPaymentReport(query);
  }
}
