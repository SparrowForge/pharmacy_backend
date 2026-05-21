import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateMediaFileDto } from './dto/create-media-file.dto';
import { ListMediaFilesQueryDto } from './dto/list-media-files-query.dto';
import { UpdateMediaFileDto } from './dto/update-media-file.dto';

@Injectable()
export class MediaFilesService {
  private readonly entity = 'media_files';
  private readonly table = 'phar_media_files';

  constructor(private readonly basicCrudService: BasicCrudService) {}

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
}
