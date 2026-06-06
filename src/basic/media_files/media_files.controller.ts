import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateMediaFileDto } from './dto/create-media-file.dto';
import { ListMediaFilesQueryDto } from './dto/list-media-files-query.dto';
import { UpdateMediaFileDto } from './dto/update-media-file.dto';
import { UploadMediaFileDto } from './dto/upload-media-file.dto';
import { MediaFilesService } from './media_files.service';
import { memoryStorage } from 'multer';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

type AuthenticatedRequest = Request & { user?: { sub?: string } };

@ApiTags('MediaFiles')
@Controller('media_files')
export class MediaFilesController {
  constructor(private readonly mediaFilesService: MediaFilesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all media_files with pagination and filters' })
  list(@Query() query: ListMediaFilesQueryDto) {
    return this.mediaFilesService.list(query);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file to Cloudinary and save metadata' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        alt_text: { type: 'string' },
        uploaded_by: { type: 'string', format: 'uuid' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaFileDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) throw new BadRequestException('file is required');
    return this.mediaFilesService.uploadFile(file, { ...dto, uploaded_by: req.user?.sub });
  }

  @Post()
  @ApiOperation({ summary: 'Create media_file record manually (no upload)' })
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
