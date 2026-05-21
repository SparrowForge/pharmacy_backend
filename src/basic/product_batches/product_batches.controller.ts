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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductBatchDto } from './dto/create-product-batch.dto';
import { ListProductBatchesQueryDto } from './dto/list-product-batches-query.dto';
import { UpdateProductBatchDto } from './dto/update-product-batch.dto';
import { ProductBatchesService } from './product_batches.service';

@ApiTags('ProductBatches')
@Controller('product_batches')
export class ProductBatchesController {
  constructor(private readonly productBatchesService: ProductBatchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product_batches with pagination and filters' })
  list(@Query() query: ListProductBatchesQueryDto) {
    return this.productBatchesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create product_batch' })
  create(@Body() dto: CreateProductBatchDto) {
    return this.productBatchesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product_batch by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productBatchesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product_batch by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductBatchDto,
  ) {
    return this.productBatchesService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete product_batch by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productBatchesService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete product_batch by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productBatchesService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted product_batch' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productBatchesService.restore(id);
  }
}
