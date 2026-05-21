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
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { ListWarehousesQueryDto } from './dto/list-warehouses-query.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehousesService } from './warehouses.service';

@ApiTags('Warehouses')
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all warehouses with pagination and filters' })
  list(@Query() query: ListWarehousesQueryDto) {
    return this.warehousesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create warehouse' })
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warehouse by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.warehousesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update warehouse by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.warehousesService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete warehouse by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.warehousesService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete warehouse by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.warehousesService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted warehouse' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.warehousesService.restore(id);
  }
}
