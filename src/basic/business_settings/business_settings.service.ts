import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateBusinessSettingDto } from './dto/create-business-setting.dto';
import { ListBusinessSettingsQueryDto } from './dto/list-business-settings-query.dto';
import { UpdateBusinessSettingDto } from './dto/update-business-setting.dto';

@Injectable()
export class BusinessSettingsService {
  private readonly entity = 'business_settings';
  private readonly table = 'phar_business_settings';

  constructor(private readonly basicCrudService: BasicCrudService) {}

  list(query: ListBusinessSettingsQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  create(dto: CreateBusinessSettingDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateBusinessSettingDto) {
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
