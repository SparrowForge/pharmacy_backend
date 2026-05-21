import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { ListShopsQueryDto } from './dto/list-shops-query.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  private readonly entity = 'shops';
  private readonly table = 'phar_shops';

  constructor(private readonly basicCrudService: BasicCrudService) {}

  list(query: ListShopsQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  create(dto: CreateShopDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateShopDto) {
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
