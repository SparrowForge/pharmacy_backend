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
import { CreateProductBadgeDto } from './dto/create-product-badge.dto';
import { ListProductBadgesQueryDto } from './dto/list-product-badges-query.dto';
import { UpdateProductBadgeDto } from './dto/update-product-badge.dto';
import { ProductBadgesService } from './product_badges.service';

@ApiTags('ProductBadges')
@Controller('product_badges')
export class ProductBadgesController {
  constructor(private readonly productBadgesService: ProductBadgesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product_badges with pagination and filters' })
  list(@Query() query: ListProductBadgesQueryDto) {
    return this.productBadgesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create product_badge' })
  create(@Body() dto: CreateProductBadgeDto) {
    return this.productBadgesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product_badge by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productBadgesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product_badge by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductBadgeDto,
  ) {
    return this.productBadgesService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete product_badge by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productBadgesService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete product_badge by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productBadgesService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted product_badge' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productBadgesService.restore(id);
  }
}
