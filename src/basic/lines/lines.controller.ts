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
import { CreateLineDto } from './dto/create-line.dto';
import { ListLinesQueryDto } from './dto/list-lines-query.dto';
import { UpdateLineDto } from './dto/update-line.dto';
import { LinesService } from './lines.service';

@ApiTags('Lines')
@Controller('lines')
export class LinesController {
  constructor(private readonly linesService: LinesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all lines with pagination and filters' })
  list(@Query() query: ListLinesQueryDto) {
    return this.linesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create line' })
  create(@Body() dto: CreateLineDto) {
    return this.linesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get line by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.linesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update line by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLineDto,
  ) {
    return this.linesService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete line by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.linesService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete line by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.linesService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted line' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.linesService.restore(id);
  }
}
