import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateThanaDto } from './dto/create-thana.dto';
import { ListThanasQueryDto } from './dto/list-thanas-query.dto';
import { UpdateThanaDto } from './dto/update-thana.dto';

@Injectable()
export class ThanasService {
  private readonly entity = 'thanas';
  private readonly table = 'phar_thanas';

  constructor(private readonly basicCrudService: BasicCrudService) {}

  list(query: ListThanasQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  create(dto: CreateThanaDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateThanaDto) {
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
