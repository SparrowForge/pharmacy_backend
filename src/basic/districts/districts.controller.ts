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
import { CreateDistrictDto } from './dto/create-district.dto';
import { ListDistrictsQueryDto } from './dto/list-districts-query.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';
import { DistrictsService } from './districts.service';

@ApiTags('Districts')
@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all districts with pagination and filters' })
  list(@Query() query: ListDistrictsQueryDto) {
    return this.districtsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create district' })
  create(@Body() dto: CreateDistrictDto) {
    return this.districtsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get district by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.districtsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update district by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDistrictDto,
  ) {
    return this.districtsService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete district by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.districtsService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete district by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.districtsService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted district' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.districtsService.restore(id);
  }
}
