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
import { CreateMediaFileDto } from './dto/create-media-file.dto';
import { ListMediaFilesQueryDto } from './dto/list-media-files-query.dto';
import { UpdateMediaFileDto } from './dto/update-media-file.dto';
import { MediaFilesService } from './media_files.service';

@ApiTags('MediaFiles')
@Controller('media_files')
export class MediaFilesController {
  constructor(private readonly mediaFilesService: MediaFilesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all media_files with pagination and filters' })
  list(@Query() query: ListMediaFilesQueryDto) {
    return this.mediaFilesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create media_file' })
  create(@Body() dto: CreateMediaFileDto) {
    return this.mediaFilesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media_file by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.mediaFilesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update media_file by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMediaFileDto,
  ) {
    return this.mediaFilesService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete media_file by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.mediaFilesService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete media_file by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.mediaFilesService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted media_file' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.mediaFilesService.restore(id);
  }
}
