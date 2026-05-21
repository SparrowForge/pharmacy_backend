import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { ListDiscountCodesQueryDto } from './dto/list-discount-codes-query.dto';
import { UpdateDiscountCodeDto } from './dto/update-discount-code.dto';

@Injectable()
export class DiscountCodesService {
  private readonly entity = 'discount_codes';
  private readonly table = 'phar_discount_codes';

  constructor(private readonly basicCrudService: BasicCrudService) {}

  list(query: ListDiscountCodesQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  create(dto: CreateDiscountCodeDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateDiscountCodeDto) {
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
