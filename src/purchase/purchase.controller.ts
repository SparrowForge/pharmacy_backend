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
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AddPurchaseOrderItemDto } from './dto/add-purchase-order-item.dto';
import { AddPurchasePaymentsDto } from './dto/add-purchase-payments.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ListPurchaseOrdersQueryDto } from './dto/list-purchase-orders-query.dto';
import { SupplierDueOrdersQueryDto } from './dto/supplier-due-orders-query.dto';
import { UpdatePurchaseOrderItemDto } from './dto/update-purchase-order-item.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseService } from './purchase.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string;
  };
};

@ApiTags('PurchaseOrders')
@Controller('purchase_orders')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get()
  @ApiOperation({
    summary: 'List purchase orders',
    description: 'Returns a paginated list of purchase orders. Supports filtering by `status`, `supplier_id`, and a free-text search `q` (matches `po_number` or supplier name). Each row includes `item_count`, `totalqty`, and `totalreceiveqty` aggregates.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of purchase orders.' })
  list(@Query() query: ListPurchaseOrdersQueryDto) {
    return this.purchaseService.list(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create purchase order with items',
    description: 'Creates a new purchase order and inserts all supplied line items in a single transaction. Totals are recalculated automatically. Returns the full order with items.',
  })
  @ApiResponse({ status: 201, description: 'Purchase order created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error or business-rule violation (e.g. negative line total).' })
  create(@Body() dto: CreatePurchaseOrderDto, @Req() req: AuthenticatedRequest) {
    return this.purchaseService.create(dto, req.user?.sub);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get purchase order details',
    description: 'Returns the full purchase order including `items` (with `current_stock_qty` from stock movements) and `payments`.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Purchase order ID' })
  @ApiResponse({ status: 200, description: 'Purchase order with items and payments.' })
  @ApiResponse({ status: 404, description: 'Purchase order not found.' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.purchaseService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update purchase order header',
    description: 'Updates header-level fields (supplier, dates, payment status, notes, etc.). Item changes use the dedicated item endpoints. Totals are recalculated after the update.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Purchase order ID' })
  @ApiResponse({ status: 200, description: 'Updated purchase order.' })
  @ApiResponse({ status: 404, description: 'Purchase order not found.' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseService.update(id, dto);
  }

  @Post(':id/items')
  @ApiOperation({
    summary: 'Add item to purchase order',
    description: 'Appends a new line item to the order. The purchase quantity is converted to stock quantity using the product unit\'s `convert_rate`. Order totals are recalculated.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Purchase order ID' })
  @ApiResponse({ status: 201, description: 'Updated purchase order with the new item.' })
  @ApiResponse({ status: 400, description: 'Validation error or line-total is negative.' })
  @ApiResponse({ status: 404, description: 'Purchase order or product not found.' })
  addItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddPurchaseOrderItemDto,
  ) {
    return this.purchaseService.addItem(id, dto);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({
    summary: 'Update a purchase order item',
    description: 'Updates an existing line item. Cannot reduce `quantity_purchase` below the already-received quantity. Order totals and receipt status are recalculated.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Purchase order ID' })
  @ApiParam({ name: 'itemId', format: 'uuid', description: 'Purchase order item ID' })
  @ApiResponse({ status: 200, description: 'Updated purchase order.' })
  @ApiResponse({ status: 400, description: 'Quantity lower than already received, or other validation error.' })
  @ApiResponse({ status: 404, description: 'Purchase order or item not found.' })
  updateItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdatePurchaseOrderItemDto,
  ) {
    return this.purchaseService.updateItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({
    summary: 'Delete a purchase order item',
    description: 'Removes a line item. Blocked if the item already has received stock (`quantity_received_stock > 0`).',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Purchase order ID' })
  @ApiParam({ name: 'itemId', format: 'uuid', description: 'Purchase order item ID' })
  @ApiResponse({ status: 200, description: 'Updated purchase order without the deleted item.' })
  @ApiResponse({ status: 400, description: 'Item already has received stock and cannot be deleted.' })
  @ApiResponse({ status: 404, description: 'Purchase order or item not found.' })
  removeItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ) {
    return this.purchaseService.removeItem(id, itemId);
  }

  @Post(':id/payments')
  @ApiOperation({
    summary: 'Record supplier payments against a purchase order',
    description:
      'Accepts an array of payment lines (`payments`), each with its own `payment_method_id` and `amount` — enabling split/multi-mode payment in one call. ' +
      'Purchase-return credits are automatically deducted from the payable amount before validation. ' +
      'After recording, `paid_amount`, `due_amount`, and `phar_payment_status` on the order are updated atomically. ' +
      'Returns the full updated purchase order including all payments.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Purchase order ID' })
  @ApiResponse({ status: 201, description: 'Payments recorded; returns updated purchase order.' })
  @ApiResponse({ status: 400, description: 'No outstanding balance, payment exceeds due amount, or validation error.' })
  @ApiResponse({ status: 404, description: 'Purchase order not found.' })
  addPayment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddPurchasePaymentsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchaseService.addPaymentToPurchaseOrder(id, dto, req.user?.sub);
  }

  @Get('suppliers/:supplierId/due-orders')
  @ApiOperation({
    summary: 'List unpaid/partially-paid purchase orders for a supplier',
    description:
      'Returns all purchase orders for the given supplier where `due_amount > 0`, ordered by date descending. ' +
      'Each row includes `total_amount`, `paid_amount`, `due_amount`, `return_amount`, and a `payments` array with existing payment history. ' +
      'Response also includes `total_due` — the sum of all outstanding balances on the current page.',
  })
  @ApiParam({ name: 'supplierId', format: 'uuid', description: 'ID of the supplier company' })
  @ApiResponse({ status: 200, description: 'Paginated due orders with total_due summary.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID or query params.' })
  getSupplierDueOrders(
    @Param('supplierId', new ParseUUIDPipe()) supplierId: string,
    @Query() query: SupplierDueOrdersQueryDto,
  ) {
    return this.purchaseService.getSupplierDueOrders(supplierId, query);
  }
}
