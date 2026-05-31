import { BadRequestException, Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { DatabaseService } from '../../database/database.service';
import { CreateProductTagDto } from './dto/create-product-tag.dto';
import { ListProductTagsQueryDto } from './dto/list-product-tags-query.dto';
import { UpdateProductTagDto } from './dto/update-product-tag.dto';

@Injectable()
export class ProductTagsService {
  private readonly entity = 'product_tags';
  private readonly table = 'phar_product_tags';

  constructor(
    private readonly basicCrudService: BasicCrudService,
    private readonly databaseService: DatabaseService,
  ) {}

  list(query: ListProductTagsQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  async getUniqueTags() {
    const result = await this.databaseService.query<{ tag: string }>(
      `
      SELECT DISTINCT tag
      FROM public.phar_product_tags
      WHERE is_delete = FALSE
      ORDER BY tag ASC
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

  async create(dto: CreateProductTagDto) {
    const uniqueTags = Array.from(
      new Set(dto.tag.map((value) => value.trim()).filter((value) => value.length > 0)),
    );

    if (!uniqueTags.length) {
      throw new BadRequestException(
        'tag must contain at least one non-empty string value',
      );
    }

    const result = await this.databaseService.query(
      `
      INSERT INTO public.phar_product_tags (product_id, tag)
      SELECT $1::uuid, value
      FROM unnest($2::text[]) AS value
      RETURNING *
      `,
      [dto.product_id, uniqueTags],
    );

    return {
      entity: this.entity,
      total: result.rows.length,
      data: result.rows,
    };
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
