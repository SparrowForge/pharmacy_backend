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
import { AddPurchaseOrderItemDto } from './dto/add-purchase-order-item.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ListPurchaseOrdersQueryDto } from './dto/list-purchase-orders-query.dto';
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
  @ApiOperation({ summary: 'List purchase orders' })
  list(@Query() query: ListPurchaseOrdersQueryDto) {
    return this.purchaseService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create purchase order with items' })
  create(@Body() dto: CreatePurchaseOrderDto, @Req() req: AuthenticatedRequest) {
    return this.purchaseService.create(dto, req.user?.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order details by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.purchaseService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update purchase order header by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseService.update(id, dto);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to purchase order' })
  addItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddPurchaseOrderItemDto,
  ) {
    return this.purchaseService.addItem(id, dto);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Update purchase order item' })
  updateItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdatePurchaseOrderItemDto,
  ) {
    return this.purchaseService.updateItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Delete purchase order item' })
  removeItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ) {
    return this.purchaseService.removeItem(id, itemId);
  }
}
