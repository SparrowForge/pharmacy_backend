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
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { ListProductImagesQueryDto } from './dto/list-product-images-query.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductImagesService } from './product_images.service';

@ApiTags('ProductImages')
@Controller('product_images')
export class ProductImagesController {
  constructor(private readonly productImagesService: ProductImagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product_images with pagination and filters' })
  list(@Query() query: ListProductImagesQueryDto) {
    return this.productImagesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create product_image' })
  create(@Body() dto: CreateProductImageDto) {
    return this.productImagesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product_image by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productImagesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product_image by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.productImagesService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete product_image by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productImagesService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete product_image by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productImagesService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted product_image' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productImagesService.restore(id);
  }
}
