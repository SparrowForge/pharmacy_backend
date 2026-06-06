import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { DatabaseService } from '../../database/database.service';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateMediaFileDto } from './dto/create-media-file.dto';
import { ListMediaFilesQueryDto } from './dto/list-media-files-query.dto';
import { UpdateMediaFileDto } from './dto/update-media-file.dto';

@Injectable()
export class MediaFilesService implements OnModuleInit {
  private readonly entity = 'media_files';
  private readonly table = 'phar_media_files';
  private readonly logger = new Logger(MediaFilesService.name);

  constructor(
    private readonly basicCrudService: BasicCrudService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly databaseService: DatabaseService,
  ) {}

  async onModuleInit() {
    await this.databaseService.query(
      `ALTER TABLE ${this.table} ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT`,
    );
  }

  list(query: ListMediaFilesQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  create(dto: CreateMediaFileDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateMediaFileDto) {
    return this.basicCrudService.update(this.entity, this.table, id, dto);
  }

  softDelete(id: string) {
    return this.basicCrudService.softDelete(this.entity, this.table, id);
  }

  restore(id: string) {
    return this.basicCrudService.restore(this.entity, this.table, id);
  }

  permanentDelete(id: string) {
    return this.basicCrudService.permanentDelete(this.entity, this.table, id);
  }

  async uploadFile(
    file: Express.Multer.File,
    meta: { alt_text?: string; uploaded_by?: string } = {},
  ): Promise<Record<string, unknown>> {
    const cloudinaryResult = await this.cloudinaryService.upload(file.buffer, {
      originalname: file.originalname,
    });

    try {
      const { rows } = await this.databaseService.query(
        `INSERT INTO ${this.table}
           (file_name, file_url, file_type, mime_type, file_size, alt_text, uploaded_by, cloudinary_public_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7::uuid, $8)
         RETURNING *`,
        [
          file.originalname,
          cloudinaryResult.secure_url,
          cloudinaryResult.resource_type,
          file.mimetype,
          cloudinaryResult.bytes,
          meta.alt_text ?? null,
          meta.uploaded_by ?? null,
          cloudinaryResult.public_id,
        ],
      );
      return rows[0];
    } catch (err) {
      this.logger.error('DB insert failed after Cloudinary upload', err);
      throw new InternalServerErrorException(
        (err as Error).message ?? 'Failed to save file metadata',
      );
    }
  }
}
