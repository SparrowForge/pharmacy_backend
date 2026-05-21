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
import { CreateZoneDto } from './dto/create-zone.dto';
import { ListZonesQueryDto } from './dto/list-zones-query.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ZonesService } from './zones.service';

@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all zones with pagination and filters' })
  list(@Query() query: ListZonesQueryDto) {
    return this.zonesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create zone' })
  create(@Body() dto: CreateZoneDto) {
    return this.zonesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get zone by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.zonesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update zone by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.zonesService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete zone by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.zonesService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete zone by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.zonesService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted zone' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.zonesService.restore(id);
  }
}
