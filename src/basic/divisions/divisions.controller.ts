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
import { CreateDivisionDto } from './dto/create-division.dto';
import { ListDivisionsQueryDto } from './dto/list-divisions-query.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { DivisionsService } from './divisions.service';

@ApiTags('Divisions')
@Controller('divisions')
export class DivisionsController {
  constructor(private readonly divisionsService: DivisionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all divisions with pagination and filters' })
  list(@Query() query: ListDivisionsQueryDto) {
    return this.divisionsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create division' })
  create(@Body() dto: CreateDivisionDto) {
    return this.divisionsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get division by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.divisionsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update division by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDivisionDto,
  ) {
    return this.divisionsService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete division by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.divisionsService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete division by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.divisionsService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted division' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.divisionsService.restore(id);
  }
}
