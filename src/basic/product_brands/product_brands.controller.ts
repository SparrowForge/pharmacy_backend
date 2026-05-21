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
import { CreateProductBrandDto } from './dto/create-product-brand.dto';
import { ListProductBrandsQueryDto } from './dto/list-product-brands-query.dto';
import { UpdateProductBrandDto } from './dto/update-product-brand.dto';
import { ProductBrandsService } from './product_brands.service';

@ApiTags('ProductBrands')
@Controller('product_brands')
export class ProductBrandsController {
  constructor(private readonly productBrandsService: ProductBrandsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product_brands with pagination and filters' })
  list(@Query() query: ListProductBrandsQueryDto) {
    return this.productBrandsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create product_brand' })
  create(@Body() dto: CreateProductBrandDto) {
    return this.productBrandsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product_brand by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productBrandsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product_brand by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductBrandDto,
  ) {
    return this.productBrandsService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete product_brand by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productBrandsService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete product_brand by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productBrandsService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted product_brand' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productBrandsService.restore(id);
  }
}
