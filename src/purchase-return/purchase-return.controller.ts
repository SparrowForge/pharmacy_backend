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
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';
import { ListPurchaseReturnsQueryDto } from './dto/list-purchase-returns-query.dto';
import { UpdatePurchaseReturnDto } from './dto/update-purchase-return.dto';
import { PurchaseReturnService } from './purchase-return.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string;
  };
};

@ApiTags('PurchaseReturns')
@Controller('purchase_return')
export class PurchaseReturnController {
  constructor(private readonly purchaseReturnService: PurchaseReturnService) {}

  @Get()
  @ApiOperation({ summary: 'List purchase returns' })
  list(@Query() query: ListPurchaseReturnsQueryDto) {
    return this.purchaseReturnService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase return details by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.purchaseReturnService.getById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create purchase return (purchase_order_id in payload) and deduct stock',
  })
  create(@Body() dto: CreatePurchaseReturnDto, @Req() req: AuthenticatedRequest) {
    return this.purchaseReturnService.create(dto, req.user?.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update purchase return; re-applies stock when items change' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePurchaseReturnDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchaseReturnService.update(id, dto, req.user?.sub);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete purchase return and reverse stock' })
  permanentDelete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchaseReturnService.permanentDelete(id, req.user?.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete purchase return and reverse stock' })
  softDelete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchaseReturnService.softDelete(id, req.user?.sub);
  }
}
