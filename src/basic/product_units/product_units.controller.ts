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
import { CreateProductUnitDto } from './dto/create-product-unit.dto';
import { ListProductUnitsQueryDto } from './dto/list-product-units-query.dto';
import { UpdateProductUnitDto } from './dto/update-product-unit.dto';
import { ProductUnitsService } from './product_units.service';

@ApiTags('ProductUnits')
@Controller('product_units')
export class ProductUnitsController {
  constructor(private readonly productUnitsService: ProductUnitsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product_units with pagination and filters' })
  list(@Query() query: ListProductUnitsQueryDto) {
    return this.productUnitsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create product_unit' })
  create(@Body() dto: CreateProductUnitDto) {
    return this.productUnitsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product_unit by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productUnitsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product_unit by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductUnitDto,
  ) {
    return this.productUnitsService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete product_unit by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productUnitsService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete product_unit by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productUnitsService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted product_unit' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productUnitsService.restore(id);
  }
}
