import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { ListBasicQueryDto } from '../dto/list-basic-query.dto';

type ColumnMetaRow = QueryResultRow & {
  column_name: string;
  data_type: string;
};

@Injectable()
export class BasicCrudService {
  private readonly metadataCache = new Map<string, ColumnMetaRow[]>();

  constructor(private readonly databaseService: DatabaseService) {}

  async list(
    entity: string,
    table: string,
    query: ListBasicQueryDto,
    exactFilters?: Record<string, unknown>,
  ) {
    const columns = await this.getColumns(table);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const includeDeleted = this.toBool(query.includeDeleted);

    const where: string[] = [];
    const params: unknown[] = [];

    const hasIsDelete = this.hasColumn(columns, 'is_delete');
    if (hasIsDelete && !includeDeleted) {
      where.push('is_delete = FALSE');
    }

    if (query.q?.trim()) {
      const searchableColumns = columns
        .filter((col) =>
          ['text', 'character varying', 'character'].includes(col.data_type),
        )
        .map((col) => col.column_name)
        .filter(
          (name) => !['verification_token', 'refresh_token_hash'].includes(name),
        );

      if (searchableColumns.length > 0) {
        const qCondition: string[] = [];
        for (const columnName of searchableColumns) {
          params.push(`%${query.q.trim()}%`);
          qCondition.push(`${this.quoteIdent(columnName)} ILIKE $${params.length}`);
        }
        where.push(`(${qCondition.join(' OR ')})`);
      }
    }

    if (exactFilters) {
      for (const [columnName, rawValue] of Object.entries(exactFilters)) {
        const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
        if (value === undefined || value === null || value === '') {
          continue;
        }

        if (!this.hasColumn(columns, columnName)) {
          throw new BadRequestException(
            `Invalid filter field "${columnName}" for entity "${entity}"`,
          );
        }

        params.push(value);
        where.push(`${this.quoteIdent(columnName)} = $${params.length}`);
      }
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderByColumn = this.hasColumn(columns, 'created_at') ? 'created_at' : 'id';

    const countResult = await this.databaseService.query<{ total: number }>(
      `
      SELECT COUNT(*)::int AS total
      FROM ${this.qualifiedTable(table)}
      ${whereClause}
      `,
      params,
    );

    const dataResult = await this.databaseService.query(
      `
      SELECT *
      FROM ${this.qualifiedTable(table)}
      ${whereClause}
      ORDER BY ${this.quoteIdent(orderByColumn)} DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, limit, offset],
    );

    return {
      entity,
      page,
      limit,
      total: countResult.rows[0]?.total ?? 0,
      data: dataResult.rows,
    };
  }

  async getById(entity: string, table: string, id: string) {
    const columns = await this.getColumns(table);

    const where: string[] = ['id = $1::uuid'];
    if (this.hasColumn(columns, 'is_delete')) {
      where.push('is_delete = FALSE');
    }

    const result = await this.databaseService.query(
      `
      SELECT *
      FROM ${this.qualifiedTable(table)}
      WHERE ${where.join(' AND ')}
      LIMIT 1
      `,
      [id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException(
        `Record not found for entity "${entity}" and id "${id}"`,
      );
    }

    return result.rows[0];
  }

  async create(entity: string, table: string, payload: object) {
    const columns = await this.getColumns(table);
    const writableColumns = this.getWritableColumns(columns);

    const { keys, values } = this.extractPayload(
      payload as Record<string, unknown>,
      writableColumns,
    );
    if (keys.length === 0) {
      throw new BadRequestException('No writable payload fields provided');
    }

    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const colList = keys.map((k) => this.quoteIdent(k)).join(', ');

    const result = await this.databaseService.query(
      `
      INSERT INTO ${this.qualifiedTable(table)} (${colList})
      VALUES (${placeholders})
      RETURNING *
      `,
      values,
    );

    return result.rows[0];
  }

  async update(entity: string, table: string, id: string, payload: object) {
    const columns = await this.getColumns(table);
    const writableColumns = this.getWritableColumns(columns);

    await this.ensureExists(table, id, true);

    const { keys, values } = this.extractPayload(
      payload as Record<string, unknown>,
      writableColumns,
    );
    if (keys.length === 0) {
      throw new BadRequestException('No writable payload fields provided');
    }

    const setClause = keys
      .map((key, idx) => `${this.quoteIdent(key)} = $${idx + 1}`)
      .join(', ');

    const result = await this.databaseService.query(
      `
      UPDATE ${this.qualifiedTable(table)}
      SET ${setClause}
      WHERE id = $${keys.length + 1}::uuid
      RETURNING *
      `,
      [...values, id],
    );

    return result.rows[0];
  }

  async softDelete(entity: string, table: string, id: string) {
    const columns = await this.getColumns(table);

    if (!this.hasColumn(columns, 'is_delete')) {
      throw new BadRequestException(
        `Soft delete is not supported for entity "${entity}" because is_delete column is missing`,
      );
    }

    await this.ensureExists(table, id, true);

    const setFragments: string[] = ['is_delete = TRUE'];
    const statusColumn = columns.find((col) => col.column_name === 'status');
    if (statusColumn) {
      if (statusColumn.data_type === 'boolean') {
        setFragments.push('status = FALSE');
      } else {
        setFragments.push(`status = 'inactive'`);
      }
    }

    await this.databaseService.query(
      `
      UPDATE ${this.qualifiedTable(table)}
      SET ${setFragments.join(', ')}
      WHERE id = $1::uuid
      `,
      [id],
    );

    return {
      message: `Soft deleted ${entity} successfully`,
      id,
    };
  }

  async restore(entity: string, table: string, id: string) {
    const columns = await this.getColumns(table);

    if (!this.hasColumn(columns, 'is_delete')) {
      throw new BadRequestException(
        `Restore is not supported for entity "${entity}" because is_delete column is missing`,
      );
    }

    await this.ensureExists(table, id, true);

    const setFragments: string[] = ['is_delete = FALSE'];
    const statusColumn = columns.find((col) => col.column_name === 'status');
    if (statusColumn) {
      if (statusColumn.data_type === 'boolean') {
        setFragments.push('status = TRUE');
      } else {
        setFragments.push(`status = 'active'`);
      }
    }

    await this.databaseService.query(
      `
      UPDATE ${this.qualifiedTable(table)}
      SET ${setFragments.join(', ')}
      WHERE id = $1::uuid
      `,
      [id],
    );

    return {
      message: `Restored ${entity} successfully`,
      id,
    };
  }

  async permanentDelete(entity: string, table: string, id: string) {
    await this.ensureExists(table, id, true);

    await this.databaseService.query(
      `
      DELETE FROM ${this.qualifiedTable(table)}
      WHERE id = $1::uuid
      `,
      [id],
    );

    return {
      message: `Permanently deleted ${entity} successfully`,
      id,
    };
  }

  private async getColumns(table: string) {
    const cacheHit = this.metadataCache.get(table);
    if (cacheHit) return cacheHit;

    const result = await this.databaseService.query<ColumnMetaRow>(
      `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
      `,
      [table],
    );

    if (!result.rows.length) {
      throw new BadRequestException(`Table metadata not found for "${table}"`);
    }

    this.metadataCache.set(table, result.rows);
    return result.rows;
  }

  private getWritableColumns(columns: ColumnMetaRow[]) {
    const blocked = new Set(['id', 'created_at', 'updated_at', 'is_delete']);
    return new Set(
      columns.map((col) => col.column_name).filter((name) => !blocked.has(name)),
    );
  }

  private extractPayload(
    payload: Record<string, unknown>,
    writableColumns: Set<string>,
  ) {
    if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
      throw new BadRequestException('Payload must be a JSON object');
    }

    const keys = Object.keys(payload);
    if (!keys.length) {
      throw new BadRequestException('Payload is empty');
    }

    const invalid = keys.filter((key) => !writableColumns.has(key));
    if (invalid.length > 0) {
      throw new BadRequestException(`Invalid or read-only fields: ${invalid.join(', ')}`);
    }

    const validKeys = keys.filter(
      (key) => Object.prototype.hasOwnProperty.call(payload, key) && payload[key] !== undefined,
    );
    const values = validKeys.map((key) => payload[key]);
    return { keys: validKeys, values };
  }

  private hasColumn(columns: ColumnMetaRow[], columnName: string) {
    return columns.some((col) => col.column_name === columnName);
  }

  private toBool(value?: string) {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  private async ensureExists(table: string, id: string, includeDeleted: boolean) {
    const columns = await this.getColumns(table);
    const conditions = ['id = $1::uuid'];
    if (this.hasColumn(columns, 'is_delete') && !includeDeleted) {
      conditions.push('is_delete = FALSE');
    }

    const result = await this.databaseService.query(
      `
      SELECT id
      FROM ${this.qualifiedTable(table)}
      WHERE ${conditions.join(' AND ')}
      LIMIT 1
      `,
      [id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException(`Record not found for id "${id}"`);
    }
  }

  private qualifiedTable(table: string) {
    return `public.${this.quoteIdent(table)}`;
  }

  private quoteIdent(identifier: string) {
    return `"${identifier.replaceAll('"', '""')}"`;
  }
}
