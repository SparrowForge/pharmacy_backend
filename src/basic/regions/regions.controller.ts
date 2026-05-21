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
import { CreateRegionDto } from './dto/create-region.dto';
import { ListRegionsQueryDto } from './dto/list-regions-query.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { RegionsService } from './regions.service';

@ApiTags('Regions')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all regions with pagination and filters' })
  list(@Query() query: ListRegionsQueryDto) {
    return this.regionsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create region' })
  create(@Body() dto: CreateRegionDto) {
    return this.regionsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get region by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.regionsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update region by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRegionDto,
  ) {
    return this.regionsService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete region by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.regionsService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete region by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.regionsService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted region' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.regionsService.restore(id);
  }
}
