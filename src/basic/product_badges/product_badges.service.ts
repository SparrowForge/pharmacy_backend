import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateProductBadgeDto } from './dto/create-product-badge.dto';
import { ListProductBadgesQueryDto } from './dto/list-product-badges-query.dto';
import { UpdateProductBadgeDto } from './dto/update-product-badge.dto';

@Injectable()
export class ProductBadgesService {
  private readonly entity = 'product_badges';
  private readonly table = 'phar_product_badges';

  constructor(private readonly basicCrudService: BasicCrudService) {}

  list(query: ListProductBadgesQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  create(dto: CreateProductBadgeDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateProductBadgeDto) {
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
