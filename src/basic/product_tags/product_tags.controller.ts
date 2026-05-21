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
import { CreateProductTagDto } from './dto/create-product-tag.dto';
import { ListProductTagsQueryDto } from './dto/list-product-tags-query.dto';
import { UpdateProductTagDto } from './dto/update-product-tag.dto';
import { ProductTagsService } from './product_tags.service';

@ApiTags('ProductTags')
@Controller('product_tags')
export class ProductTagsController {
  constructor(private readonly productTagsService: ProductTagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product_tags with pagination and filters' })
  list(@Query() query: ListProductTagsQueryDto) {
    return this.productTagsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create product_tag' })
  create(@Body() dto: CreateProductTagDto) {
    return this.productTagsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product_tag by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productTagsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product_tag by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductTagDto,
  ) {
    return this.productTagsService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete product_tag by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productTagsService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete product_tag by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productTagsService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted product_tag' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productTagsService.restore(id);
  }
}
