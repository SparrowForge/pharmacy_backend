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
import { CreateProductOfferDto } from './dto/create-product-offer.dto';
import { ListProductOffersQueryDto } from './dto/list-product-offers-query.dto';
import { UpdateProductOfferDto } from './dto/update-product-offer.dto';
import { ProductOffersService } from './product_offers.service';

@ApiTags('ProductOffers')
@Controller('product_offers')
export class ProductOffersController {
  constructor(private readonly productOffersService: ProductOffersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product_offers with pagination and filters' })
  list(@Query() query: ListProductOffersQueryDto) {
    return this.productOffersService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create product_offer' })
  create(@Body() dto: CreateProductOfferDto) {
    return this.productOffersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product_offer by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productOffersService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product_offer by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductOfferDto,
  ) {
    return this.productOffersService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete product_offer by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productOffersService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete product_offer by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productOffersService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted product_offer' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productOffersService.restore(id);
  }
}
