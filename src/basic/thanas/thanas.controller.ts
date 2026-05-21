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
import { CreateThanaDto } from './dto/create-thana.dto';
import { ListThanasQueryDto } from './dto/list-thanas-query.dto';
import { UpdateThanaDto } from './dto/update-thana.dto';
import { ThanasService } from './thanas.service';

@ApiTags('Thanas')
@Controller('thanas')
export class ThanasController {
  constructor(private readonly thanasService: ThanasService) {}

  @Get()
  @ApiOperation({ summary: 'Get all thanas with pagination and filters' })
  list(@Query() query: ListThanasQueryDto) {
    return this.thanasService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create thana' })
  create(@Body() dto: CreateThanaDto) {
    return this.thanasService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get thana by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.thanasService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update thana by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateThanaDto,
  ) {
    return this.thanasService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete thana by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.thanasService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete thana by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.thanasService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted thana' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.thanasService.restore(id);
  }
}
