import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateProductTagDto } from './dto/create-product-tag.dto';
import { ListProductTagsQueryDto } from './dto/list-product-tags-query.dto';
import { UpdateProductTagDto } from './dto/update-product-tag.dto';

@Injectable()
export class ProductTagsService {
  private readonly entity = 'product_tags';
  private readonly table = 'phar_product_tags';

  constructor(private readonly basicCrudService: BasicCrudService) {}

  list(query: ListProductTagsQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  create(dto: CreateProductTagDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateProductTagDto) {
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
