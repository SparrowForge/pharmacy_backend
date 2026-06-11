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
import { CreateSalesReturnDto } from './dto/create-sales-return.dto';
import { ListSalesReturnsQueryDto } from './dto/list-sales-returns-query.dto';
import { UpdateSalesReturnDto } from './dto/update-sales-return.dto';
import { SalesReturnService } from './sales-return.service';

type AuthenticatedRequest = Request & {
  user?: { sub?: string };
};

@ApiTags('SalesReturns')
@Controller('sales_returns')
export class SalesReturnController {
  constructor(private readonly salesReturnService: SalesReturnService) {}

  @Get()
  @ApiOperation({
    summary: 'List sales returns',
    description:
      'Returns a paginated list of sales returns. Filter by status, customer, or originating invoice. Pass `includeDeleted=true` to include soft-deleted records.',
  })
  list(@Query() query: ListSalesReturnsQueryDto) {
    return this.salesReturnService.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get sales return details by id',
    description: 'Returns the full sales return header and its line items.',
  })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.salesReturnService.getById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create sales return and restore stock',
    description:
      'Creates a return against a completed sales invoice. Stock is immediately added back for every returned item. ' +
      'Provide `sales_invoice_item_id` for each line to link back to the original invoice items.',
  })
  create(@Body() dto: CreateSalesReturnDto, @Req() req: AuthenticatedRequest) {
    return this.salesReturnService.create(dto, req.user?.sub);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update sales return',
    description:
      'Updates the return header fields. When `items` is provided the existing lines are fully replaced: ' +
      'current stock effects are reversed, then the new lines are re-applied.',
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSalesReturnDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.salesReturnService.update(id, dto, req.user?.sub);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete sales return and reverse stock',
    description:
      'Marks the return as deleted (is_delete=true, status=cancelled) and reverses the stock that was added back on creation.',
  })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: AuthenticatedRequest) {
    return this.salesReturnService.softDelete(id, req.user?.sub);
  }

  @Delete(':id/permanent')
  @ApiOperation({
    summary: 'Permanently delete sales return and reverse stock',
    description:
      'Removes the sales return record from the database entirely. If it has not already been soft-deleted, stock is reversed first.',
  })
  permanentDelete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.salesReturnService.permanentDelete(id, req.user?.sub);
  }
}
