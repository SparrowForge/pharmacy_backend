import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateProductBrandDto } from './dto/create-product-brand.dto';
import { ListProductBrandsQueryDto } from './dto/list-product-brands-query.dto';
import { UpdateProductBrandDto } from './dto/update-product-brand.dto';

@Injectable()
export class ProductBrandsService {
  private readonly entity = 'product_brands';
  private readonly table = 'phar_product_brands';

  constructor(private readonly basicCrudService: BasicCrudService) {}

  list(query: ListProductBrandsQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  create(dto: CreateProductBrandDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateProductBrandDto) {
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
