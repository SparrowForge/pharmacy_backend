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
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CreatePurchaseReceiptDto } from './dto/create-purchase-receipt.dto';
import { UpdatePurchaseReceiptDto } from './dto/update-purchase-receipt.dto';
import { PurchaseReceiptsService } from './purchase-receipts.service';
import { ListBasicQueryDto } from '../basic/dto/list-basic-query.dto';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string;
  };
};

@ApiTags('PurchaseReceipts')
@Controller('purchase_receipts')
export class PurchaseReceiptsController {
  constructor(private readonly receiptsService: PurchaseReceiptsService) {}

  @Get()
  @ApiOperation({ summary: 'List purchase receipts' })
  list(@Query() query: ListBasicQueryDto) {
    return this.receiptsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a purchase receipt from an existing purchase order' })
  create(
    @Body() dto: CreatePurchaseReceiptDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.receiptsService.create(dto, req.user?.sub);
  }

  @Get('available-items')
  @ApiOperation({
    summary: 'List receipt items for a product whose batch still has stock available for sale',
    description:
      'Returns purchase receipt items for the given product where the linked batch is not deleted ' +
      'and still has quantity_on_hand > 0 (i.e. not fully sold or returned). Each item includes the ' +
      "batch selling_price and available_stock (the batch's current quantity_on_hand).",
  })
  @ApiQuery({
    name: 'product_id',
    required: true,
    type: String,
    format: 'uuid',
    description: 'UUID of the product to list available receipt items for',
  })
  listAvailableItems(@Query('product_id', new ParseUUIDPipe()) productId: string) {
    return this.receiptsService.listAvailableItemsByProduct(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase receipt by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.receiptsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update purchase receipt metadata by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePurchaseReceiptDto,
  ) {
    return this.receiptsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete purchase receipt by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.receiptsService.softDelete(id);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete purchase receipt by id' })
  permanentlyDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.receiptsService.permanentDelete(id);
  }
}
