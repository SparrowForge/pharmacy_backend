import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateProductUnitDto } from './dto/create-product-unit.dto';
import { ListProductUnitsQueryDto } from './dto/list-product-units-query.dto';
import { UpdateProductUnitDto } from './dto/update-product-unit.dto';

@Injectable()
export class ProductUnitsService {
  private readonly entity = 'product_units';
  private readonly table = 'phar_product_units';

  constructor(private readonly basicCrudService: BasicCrudService) {}

  list(query: ListProductUnitsQueryDto) {
    const exactFilters: Record<string, unknown> = {};
    if (query.unit_type) {
      exactFilters.unit_type = query.unit_type;
    }

    return this.basicCrudService.list(
      this.entity,
      this.table,
      query,
      exactFilters,
    );
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  create(dto: CreateProductUnitDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateProductUnitDto) {
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
