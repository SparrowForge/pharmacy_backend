import { BadRequestException, Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { DatabaseService } from '../../database/database.service';
import { CreateProductBadgeDto } from './dto/create-product-badge.dto';
import { ListProductBadgesQueryDto } from './dto/list-product-badges-query.dto';
import { UpdateProductBadgeDto } from './dto/update-product-badge.dto';

@Injectable()
export class ProductBadgesService {
  private readonly entity = 'product_badges';
  private readonly table = 'phar_product_badges';

  constructor(
    private readonly basicCrudService: BasicCrudService,
    private readonly databaseService: DatabaseService,
  ) {}

  list(query: ListProductBadgesQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  async getUniqueBadges() {
    const result = await this.databaseService.query<{ badge: string }>(
      `
      SELECT DISTINCT badge
      FROM public.phar_product_badges
      WHERE is_delete = FALSE
      ORDER BY badge ASC
      `,
    );

    return {
      entity: this.entity,
      total: result.rows.length,
      data: result.rows,
    };
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  async create(dto: CreateProductBadgeDto) {
    const uniqueBadges = Array.from(
      new Set(dto.badge.map((value) => value.trim()).filter((value) => value.length > 0)),
    );

    if (!uniqueBadges.length) {
      throw new BadRequestException(
        'badge must contain at least one non-empty string value',
      );
    }

    const result = await this.databaseService.query(
      `
      INSERT INTO public.phar_product_badges (product_id, badge)
      SELECT $1::uuid, value
      FROM unnest($2::text[]) AS value
      RETURNING *
      `,
      [dto.product_id, uniqueBadges],
    );

    return {
      entity: this.entity,
      total: result.rows.length,
      data: result.rows,
    };
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
