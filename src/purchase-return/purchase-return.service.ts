import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolClient, QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';
import { PurchaseService } from '../purchase/purchase.service';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';
import { ListPurchaseReturnsQueryDto } from './dto/list-purchase-returns-query.dto';
import { UpdatePurchaseReturnDto } from './dto/update-purchase-return.dto';

type PurchaseReturnRow = QueryResultRow & {
  id: string;
  return_number: string;
  purchase_order_id: string | null;
  supplier_id: string | null;
  shop_id: string | null;
  branch_id: string | null;
  status: string;
  total_amount: string;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  processed_by: string | null;
  processed_at: string | null;
  is_delete: boolean;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class PurchaseReturnService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly purchaseService: PurchaseService,
  ) {}

  async list(query: ListPurchaseReturnsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const includeDeleted = query.includeDeleted === 'true';

    const where: string[] = [];
    const params: unknown[] = [];

    if (!includeDeleted) {
      where.push('pr.is_delete = FALSE');
    }

    if (query.status) {
      params.push(query.status);
      where.push(`pr.status = $${params.length}`);
    }

    if (query.supplier_id) {
      params.push(query.supplier_id);
      where.push(`pr.supplier_id = $${params.length}::uuid`);
    }

    if (query.purchase_order_id) {
      params.push(query.purchase_order_id);
      where.push(`pr.purchase_order_id = $${params.length}::uuid`);
    }

    if (query.q?.trim()) {
      params.push(`%${query.q.trim()}%`);
      where.push(
        `(pr.return_number ILIKE $${params.length} OR c.name ILIKE $${params.length})`,
      );
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await this.databaseService.query<{ total: number }>(
      `
      SELECT COUNT(*)::int AS total
      FROM phar_purchase_returns pr
      LEFT JOIN phar_companies c ON c.id = pr.supplier_id
      ${whereClause}
      `,
      params,
    );

    const dataResult = await this.databaseService.query<PurchaseReturnRow>(
      `
      SELECT
        pr.*,
        c.name AS supplier_name,
        po.po_number AS po_number,
        COUNT(pri.id)::int AS item_count,
        COALESCE(SUM(pri.qty_return_stock), 0)::int AS total_return_stock
      FROM phar_purchase_returns pr
      LEFT JOIN phar_companies c ON c.id = pr.supplier_id
      LEFT JOIN phar_purchase_orders po ON po.id = pr.purchase_order_id
      LEFT JOIN phar_purchase_return_items pri ON pri.purchase_return_id = pr.id
      ${whereClause}
      GROUP BY pr.id, c.name, po.po_number
      ORDER BY pr.created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, limit, offset],
    );

    return {
      entity: 'purchase_returns',
      page,
      limit,
      total: countResult.rows[0]?.total ?? 0,
      data: dataResult.rows.map((row) => this.normalizeReturn(row)),
    };
  }

  async getById(id: string, client?: PoolClient) {
    const header = await this.getReturnById(id, client);
    const items = await this.getReturnItems(id, client);

    return {
      ...header,
      items,
    };
  }

  async create(dto: CreatePurchaseReturnDto, createdBy?: string) {
    return this.purchaseService.processReturn(dto.purchase_order_id, dto, createdBy);
  }

  async update(id: string, dto: UpdatePurchaseReturnDto, processedBy?: string) {
    return this.databaseService.withTransaction(async (client) => {
      const existing = await this.ensureReturnExists(client, id);

      if (existing.is_delete) {
        throw new BadRequestException('Cannot update a deleted purchase return');
      }

      // Replace the lines (and their stock effect) when a new item set is provided.
      if (dto.items !== undefined) {
        if (!existing.purchase_order_id) {
          throw new BadRequestException(
            'Cannot re-process items for a return without a linked purchase order',
          );
        }

        await this.purchaseService.reverseReturnStock(client, id, processedBy);
        await client.query(
          `DELETE FROM phar_purchase_return_items WHERE purchase_return_id = $1::uuid`,
          [id],
        );

        const order = {
          id: existing.purchase_order_id,
          shop_id: existing.shop_id,
          branch_id: existing.branch_id,
        };

        let totalAmount = 0;
        for (const itemDto of dto.items) {
          totalAmount += await this.purchaseService.applyReturnItemStock(client, {
            order,
            purchaseReturnId: id,
            itemDto,
            notes: dto.notes ?? existing.notes,
            processedBy,
          });
        }

        await client.query(
          `UPDATE phar_purchase_returns SET total_amount = $1 WHERE id = $2::uuid`,
          [this.roundMoney(totalAmount), id],
        );
      }

      const set: string[] = [];
      const values: unknown[] = [];
      const assign = (column: string, value: unknown, cast = '') => {
        values.push(value);
        set.push(`${column} = $${values.length}${cast}`);
      };

      if (dto.return_number !== undefined) assign('return_number', dto.return_number);
      if (dto.status !== undefined) assign('status', dto.status);
      if (dto.reason !== undefined) assign('reason', dto.reason ?? null);
      if (dto.notes !== undefined) assign('notes', dto.notes ?? null);

      if (set.length > 0) {
        set.push('updated_at = now()');
        values.push(id);
        await client.query(
          `UPDATE phar_purchase_returns SET ${set.join(', ')} WHERE id = $${values.length}::uuid`,
          values,
        );
      }

      return this.getById(id, client);
    });
  }

  async softDelete(id: string, processedBy?: string) {
    return this.databaseService.withTransaction(async (client) => {
      const existing = await this.ensureReturnExists(client, id);

      if (existing.is_delete) {
        return {
          message: 'Purchase return already deleted',
          purchase_return: this.normalizeReturn(existing),
        };
      }

      await this.purchaseService.reverseReturnStock(client, id, processedBy);

      const result = await client.query<PurchaseReturnRow>(
        `
        UPDATE phar_purchase_returns
        SET is_delete = TRUE, status = 'cancelled', updated_at = now()
        WHERE id = $1::uuid
        RETURNING *
        `,
        [id],
      );

      return {
        message: 'Purchase return soft deleted and stock reversed',
        purchase_return: this.normalizeReturn(result.rows[0]),
      };
    });
  }

  async permanentDelete(id: string, processedBy?: string) {
    return this.databaseService.withTransaction(async (client) => {
      const existing = await this.ensureReturnExists(client, id);

      // Reverse stock only if it has not already been reversed by a soft delete.
      if (!existing.is_delete) {
        await this.purchaseService.reverseReturnStock(client, id, processedBy);
      }

      await client.query(`DELETE FROM phar_purchase_returns WHERE id = $1::uuid`, [id]);

      return {
        message: 'Purchase return permanently deleted',
        id,
      };
    });
  }

  private async getReturnById(id: string, client?: PoolClient) {
    const executor = client ?? this.databaseService;
    const result = await executor.query<PurchaseReturnRow>(
      `
      SELECT
        pr.*,
        c.name AS supplier_name,
        po.po_number AS po_number
      FROM phar_purchase_returns pr
      LEFT JOIN phar_companies c ON c.id = pr.supplier_id
      LEFT JOIN phar_purchase_orders po ON po.id = pr.purchase_order_id
      WHERE pr.id = $1::uuid
      LIMIT 1
      `,
      [id],
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Purchase return not found for id "${id}"`);
    }
    return this.normalizeReturn(row);
  }

  private async getReturnItems(returnId: string, client?: PoolClient) {
    const executor = client ?? this.databaseService;
    const result = await executor.query(
      `
      SELECT
        pri.*,
        json_build_object(
          'id', p.id,
          'sku', p.sku,
          'barcode', p.barcode,
          'name', p.name,
          'calling_name', p.calling_name,
          'generic_name', p.generic_name,
          'unit_id', p.unit_id,
          'default_unit_id', p.default_unit_id,
          'current_stock', p.current_stock
        ) AS product,
        p.name AS product_name,
        ru.name AS return_unit_name,
        pb.batch_number AS batch_number
      FROM phar_purchase_return_items pri
      JOIN phar_products p ON p.id = pri.product_id
      LEFT JOIN phar_product_units ru ON ru.id = pri.return_unit_id
      LEFT JOIN phar_product_batches pb ON pb.id = pri.product_batch_id
      WHERE pri.purchase_return_id = $1::uuid
      ORDER BY pri.created_at ASC
      `,
      [returnId],
    );

    return result.rows.map((row) => ({
      ...row,
      return_qty: this.toNumber(row.return_qty),
      qty_return_stock: this.toNumber(row.qty_return_stock),
      converted_rate_used: this.toNumber(row.converted_rate_used),
      quantity: this.toNumber(row.quantity),
      unit_cost: this.toNumber(row.unit_cost),
      line_total: this.toNumber(row.line_total),
    }));
  }

  private async ensureReturnExists(client: PoolClient, id: string) {
    const result = await client.query<PurchaseReturnRow>(
      `
      SELECT *
      FROM phar_purchase_returns
      WHERE id = $1::uuid
      FOR UPDATE
      LIMIT 1
      `,
      [id],
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Purchase return not found for id "${id}"`);
    }
    return row;
  }

  private normalizeReturn(row: PurchaseReturnRow) {
    return {
      ...row,
      total_amount: this.toNumber(row.total_amount),
    };
  }

  private roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private toNumber(value: unknown) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }
}
