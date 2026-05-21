import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateProductOfferDto } from './dto/create-product-offer.dto';
import { ListProductOffersQueryDto } from './dto/list-product-offers-query.dto';
import { UpdateProductOfferDto } from './dto/update-product-offer.dto';

@Injectable()
export class ProductOffersService {
  private readonly entity = 'product_offers';
  private readonly table = 'phar_product_offers';

  constructor(private readonly basicCrudService: BasicCrudService) {}

  list(query: ListProductOffersQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  create(dto: CreateProductOfferDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateProductOfferDto) {
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
