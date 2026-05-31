import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { DatabaseService } from '../../database/database.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private readonly entity = 'products';
  private readonly table = 'phar_products';

  constructor(
    private readonly basicCrudService: BasicCrudService,
    private readonly databaseService: DatabaseService,
  ) {}

  list(query: ListProductsQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  async getById(id: string) {
    const product = await this.basicCrudService.getById(this.entity, this.table, id);

    const [tagsResult, badgesResult] = await Promise.all([
      this.databaseService.query<{ tag: string }>(
        `
        SELECT DISTINCT tag
        FROM public.phar_product_tags
        WHERE product_id = $1::uuid
          AND is_delete = FALSE
        ORDER BY tag ASC
        `,
        [id],
      ),
      this.databaseService.query<{ badge: string }>(
        `
        SELECT DISTINCT badge
        FROM public.phar_product_badges
        WHERE product_id = $1::uuid
          AND is_delete = FALSE
        ORDER BY badge ASC
        `,
        [id],
      ),
    ]);

    return {
      ...product,
      product_tag: tagsResult.rows.map((row) => row.tag),
      product_badges: badgesResult.rows.map((row) => row.badge),
    };
  }

  create(dto: CreateProductDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateProductDto) {
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
