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
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { ListProductCategoriesQueryDto } from './dto/list-product-categories-query.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoriesService } from './product_categories.service';

@ApiTags('ProductCategories')
@Controller('product_categories')
export class ProductCategoriesController {
  constructor(private readonly productCategoriesService: ProductCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product_categories with pagination and filters' })
  list(@Query() query: ListProductCategoriesQueryDto) {
    return this.productCategoriesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create product_category' })
  create(@Body() dto: CreateProductCategoryDto) {
    return this.productCategoriesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product_category by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productCategoriesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product_category by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductCategoryDto,
  ) {
    return this.productCategoriesService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete product_category by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productCategoriesService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete product_category by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productCategoriesService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted product_category' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productCategoriesService.restore(id);
  }
}
