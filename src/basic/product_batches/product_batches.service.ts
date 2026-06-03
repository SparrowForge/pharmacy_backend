import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateProductBatchDto } from './dto/create-product-batch.dto';
import { ListProductBatchesQueryDto } from './dto/list-product-batches-query.dto';
import { UpdateProductBatchDto } from './dto/update-product-batch.dto';

@Injectable()
export class ProductBatchesService {
  private readonly entity = 'product_batches';
  private readonly table = 'phar_product_batches';

  constructor(private readonly basicCrudService: BasicCrudService) {}

  list(query: ListProductBatchesQueryDto) {
    const exactFilters: Record<string, unknown> = {};
    if (query.product_id) {
      exactFilters.product_id = query.product_id;
    }

    return this.basicCrudService.list(this.entity, this.table, query, exactFilters);
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  create(dto: CreateProductBatchDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateProductBatchDto) {
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
