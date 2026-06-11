import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PoolClient, QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';
import { CreateSalesReturnDto } from './dto/create-sales-return.dto';
import { CreateSalesReturnItemDto } from './dto/create-sales-return-item.dto';
import { ListSalesReturnsQueryDto } from './dto/list-sales-returns-query.dto';
import { UpdateSalesReturnDto } from './dto/update-sales-return.dto';

type SalesReturnRow = QueryResultRow & {
  id: string;
  return_number: string;
  sales_invoice_id: string;
  customer_id: string | null;
  shop_id: string | null;
  branch_id: string | null;
  status: string;
  total_amount: string;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  processed_by: string | null;
  is_delete: boolean;
  return_date: string;
  created_at: string;
  updated_at: string;
};

type SalesReturnItemRow = QueryResultRow & {
  id: string;
  sales_return_id: string;
  sales_invoice_item_id: string;
  product_id: string;
  product_batch_id: string | null;
  return_unit_id: string | null;
  return_qty: string;
  qty_return_stock: string;
  converted_rate_used: string;
  unit_price: string;
  line_total: string;
  reason: string | null;
  created_at: string;
};

type InvoiceItemContextRow = QueryResultRow & {
  id: string;
  sales_invoice_id: string;
  product_id: string;
  product_batch_id: string | null;
  sales_unit_id: string | null;
  unit_price: string;
  stock_sales_qty: number;
  stock_unit_id: string | null;
  default_unit_id: string | null;
};

@Injectable()
export class SalesReturnService {
  constructor(private readonly databaseService: DatabaseService) {}

  async list(query: ListSalesReturnsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const includeDeleted = query.includeDeleted === 'true';

    const where: string[] = [];
    const params: unknown[] = [];

    if (!includeDeleted) {
      where.push('sr.is_delete = FALSE');
    }

    if (query.status) {
      params.push(query.status);
      where.push(`sr.status = $${params.length}`);
    }

    if (query.customer_id) {
      params.push(query.customer_id);
      where.push(`sr.customer_id = $${params.length}::uuid`);
    }

    if (query.sales_invoice_id) {
      params.push(query.sales_invoice_id);
      where.push(`sr.sales_invoice_id = $${params.length}::uuid`);
    }

    if (query.q?.trim()) {
      params.push(`%${query.q.trim()}%`);
      where.push(
        `(sr.return_number ILIKE $${params.length} OR COALESCE(c.name, '') ILIKE $${params.length})`,
      );
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await this.databaseService.query<{ total: number }>(
      `
      SELECT COUNT(*)::int AS total
      FROM phar_sales_returns sr
      LEFT JOIN phar_companies c ON c.id = sr.customer_id
      ${whereClause}
      `,
      params,
    );

    const dataResult = await this.databaseService.query<SalesReturnRow>(
      `
      SELECT
        sr.*,
        c.name AS customer_name,
        si.invoice_number,
        COUNT(sri.id)::int AS item_count
      FROM phar_sales_returns sr
      LEFT JOIN phar_companies c ON c.id = sr.customer_id
      LEFT JOIN phar_sales_invoices si ON si.id = sr.sales_invoice_id
      LEFT JOIN phar_sales_return_items sri ON sri.sales_return_id = sr.id
      ${whereClause}
      GROUP BY sr.id, c.name, si.invoice_number
      ORDER BY sr.created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, limit, offset],
    );

    return {
      entity: 'sales_returns',
      page,
      limit,
      total: countResult.rows[0]?.total ?? 0,
      data: dataResult.rows.map((row) => this.normalizeReturn(row)),
    };
  }

  async getById(id: string, client?: PoolClient) {
    const header = await this.getReturnById(id, client);
    const items = await this.getReturnItems(id, client);

    return { ...header, items };
  }

  async create(dto: CreateSalesReturnDto, createdBy?: string) {
    return this.databaseService.withTransaction(async (client) => {
      const invoice = await this.getInvoiceForReturn(client, dto.sales_invoice_id);

      if (invoice.status !== 'completed') {
        throw new BadRequestException(
          `Sales returns can only be created for completed invoices. Current status: "${invoice.status}"`,
        );
      }

      const returnNumber =
        dto.return_number?.trim() || (await this.generateReturnNumber(client));

      let salesReturn: SalesReturnRow;
      try {
        const result = await client.query<SalesReturnRow>(
          `
          INSERT INTO phar_sales_returns (
            return_number, sales_invoice_id, customer_id, shop_id, branch_id,
            status, reason, notes, created_by, return_date
          ) VALUES (
            $1, $2::uuid, $3::uuid, $4::uuid, $5::uuid,
            $6, $7, $8, $9::uuid, COALESCE($10::timestamptz, now())
          )
          RETURNING *
          `,
          [
            returnNumber,
            dto.sales_invoice_id,
            invoice.customer_id ?? null,
            invoice.shop_id ?? null,
            invoice.branch_id ?? null,
            dto.status ?? 'completed',
            dto.reason ?? null,
            dto.notes ?? null,
            createdBy ?? null,
            dto.return_date ?? null,
          ],
        );
        salesReturn = result.rows[0];
      } catch (error: unknown) {
        this.handlePgError(error);
      }

      let totalAmount = 0;
      for (const itemDto of dto.items) {
        totalAmount += await this.applyReturnItemStock(client, {
          salesReturn,
          itemDto,
          notes: dto.notes,
          createdBy,
        });
      }

      await client.query(
        `UPDATE phar_sales_returns SET total_amount = $1 WHERE id = $2::uuid`,
        [this.roundMoney(totalAmount), salesReturn.id],
      );

      return this.getById(salesReturn.id, client);
    });
  }

  async update(id: string, dto: UpdateSalesReturnDto, processedBy?: string) {
    return this.databaseService.withTransaction(async (client) => {
      const existing = await this.ensureReturnExists(client, id);

      if (existing.is_delete) {
        throw new BadRequestException('Cannot update a deleted sales return');
      }

      if (dto.items !== undefined) {
        await this.reverseReturnStock(client, id, processedBy);
        await client.query(
          `DELETE FROM phar_sales_return_items WHERE sales_return_id = $1::uuid`,
          [id],
        );

        let totalAmount = 0;
        for (const itemDto of dto.items) {
          totalAmount += await this.applyReturnItemStock(client, {
            salesReturn: existing,
            itemDto,
            notes: dto.notes ?? existing.notes ?? undefined,
            createdBy: processedBy,
          });
        }

        await client.query(
          `UPDATE phar_sales_returns SET total_amount = $1 WHERE id = $2::uuid`,
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
      if (processedBy !== undefined) assign('processed_by', processedBy, '::uuid');

      if (set.length > 0) {
        set.push('updated_at = now()');
        values.push(id);
        await client.query(
          `UPDATE phar_sales_returns SET ${set.join(', ')} WHERE id = $${values.length}::uuid`,
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
          message: 'Sales return already deleted',
          sales_return: this.normalizeReturn(existing),
        };
      }

      await this.reverseReturnStock(client, id, processedBy);

      const result = await client.query<SalesReturnRow>(
        `
        UPDATE phar_sales_returns
        SET is_delete = TRUE, status = 'cancelled', updated_at = now()
        WHERE id = $1::uuid
        RETURNING *
        `,
        [id],
      );

      return {
        message: 'Sales return soft deleted and stock reversed',
        sales_return: this.normalizeReturn(result.rows[0]),
      };
    });
  }

  async permanentDelete(id: string, processedBy?: string) {
    return this.databaseService.withTransaction(async (client) => {
      const existing = await this.ensureReturnExists(client, id);

      if (!existing.is_delete) {
        await this.reverseReturnStock(client, id, processedBy);
      }

      await client.query(`DELETE FROM phar_sales_returns WHERE id = $1::uuid`, [id]);

      return { message: 'Sales return permanently deleted', id };
    });
  }

  private async applyReturnItemStock(
    client: PoolClient,
    params: {
      salesReturn: SalesReturnRow;
      itemDto: CreateSalesReturnItemDto;
      notes?: string | null;
      createdBy?: string;
    },
  ): Promise<number> {
    const { salesReturn, itemDto, notes, createdBy } = params;

    const invoiceItemResult = await client.query<InvoiceItemContextRow>(
      `
      SELECT
        sii.id, sii.sales_invoice_id, sii.product_id, sii.product_batch_id,
        sii.sales_unit_id, sii.unit_price, sii.stock_sales_qty,
        p.unit_id AS stock_unit_id, p.default_unit_id
      FROM phar_sales_invoice_items sii
      JOIN phar_products p ON p.id = sii.product_id
      WHERE sii.id = $1::uuid
        AND sii.sales_invoice_id = $2::uuid
      LIMIT 1
      `,
      [itemDto.sales_invoice_item_id, salesReturn.sales_invoice_id],
    );

    const invoiceItem = invoiceItemResult.rows[0];
    if (!invoiceItem) {
      throw new NotFoundException(
        `Invoice item "${itemDto.sales_invoice_item_id}" not found on invoice "${salesReturn.sales_invoice_id}"`,
      );
    }

    const stockUnitId = invoiceItem.stock_unit_id;
    const returnUnitId =
      itemDto.return_unit_id ?? invoiceItem.sales_unit_id ?? stockUnitId;

    let convertRate = 1;
    if (returnUnitId && returnUnitId !== stockUnitId) {
      const unitResult = await client.query<{ convert_rate: string }>(
        `SELECT convert_rate FROM phar_product_units WHERE id = $1::uuid LIMIT 1`,
        [returnUnitId],
      );
      const unit = unitResult.rows[0];
      if (!unit) {
        throw new NotFoundException(`Return unit "${returnUnitId}" not found`);
      }
      convertRate = this.toNumber(unit.convert_rate);
      if (!(convertRate > 0)) {
        throw new BadRequestException(
          `convert_rate must be > 0 for return unit "${returnUnitId}"`,
        );
      }
    }

    const returnQty = this.ensurePositive(itemDto.return_qty, 'return_qty');
    const qtyReturnStock = this.toStockQuantity(returnQty, convertRate);
    const unitPrice =
      itemDto.unit_price !== undefined
        ? this.ensureNonNegative(itemDto.unit_price, 'unit_price')
        : this.toNumber(invoiceItem.unit_price);
    const lineTotal = this.roundMoney(returnQty * unitPrice);

    await client.query(
      `
      INSERT INTO phar_sales_return_items (
        sales_return_id, sales_invoice_item_id, product_id, product_batch_id,
        return_unit_id, return_qty, qty_return_stock, converted_rate_used,
        unit_price, line_total, reason
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, $4::uuid,
        $5::uuid, $6, $7, $8,
        $9, $10, $11
      )
      `,
      [
        salesReturn.id,
        itemDto.sales_invoice_item_id,
        invoiceItem.product_id,
        invoiceItem.product_batch_id ?? null,
        returnUnitId ?? null,
        returnQty,
        qtyReturnStock,
        convertRate,
        unitPrice,
        lineTotal,
        itemDto.reason ?? null,
      ],
    );

    await client.query(
      `UPDATE phar_products SET current_stock = current_stock + $1 WHERE id = $2::uuid`,
      [qtyReturnStock, invoiceItem.product_id],
    );

    if (invoiceItem.product_batch_id) {
      await client.query(
        `UPDATE phar_product_batches SET quantity_on_hand = quantity_on_hand + $1 WHERE id = $2::uuid`,
        [qtyReturnStock, invoiceItem.product_batch_id],
      );
    }

    await client.query(
      `
      INSERT INTO phar_stock_movements (
        shop_id, branch_id, product_id, product_batch_id,
        movement_type, reference_type, reference_id,
        quantity, unit_cost, notes, created_by
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, $4::uuid,
        'sales_return', 'sales_return', $5::uuid,
        $6, $7, $8, $9::uuid
      )
      `,
      [
        salesReturn.shop_id ?? null,
        salesReturn.branch_id ?? null,
        invoiceItem.product_id,
        invoiceItem.product_batch_id ?? null,
        salesReturn.id,
        qtyReturnStock,
        unitPrice,
        notes ?? null,
        createdBy ?? null,
      ],
    );

    return lineTotal;
  }

  private async reverseReturnStock(
    client: PoolClient,
    returnId: string,
    processedBy?: string,
  ) {
    const returnResult = await client.query<SalesReturnRow>(
      `SELECT * FROM phar_sales_returns WHERE id = $1::uuid LIMIT 1`,
      [returnId],
    );
    const salesReturn = returnResult.rows[0];

    const itemsResult = await client.query<SalesReturnItemRow>(
      `
      SELECT * FROM phar_sales_return_items
      WHERE sales_return_id = $1::uuid
      FOR UPDATE
      `,
      [returnId],
    );

    for (const item of itemsResult.rows) {
      const qtyReturnStock = this.toNumber(item.qty_return_stock);

      await client.query(
        `UPDATE phar_products SET current_stock = current_stock - $1 WHERE id = $2::uuid`,
        [qtyReturnStock, item.product_id],
      );

      if (item.product_batch_id) {
        await client.query(
          `UPDATE phar_product_batches SET quantity_on_hand = quantity_on_hand - $1 WHERE id = $2::uuid`,
          [qtyReturnStock, item.product_batch_id],
        );
      }

      await client.query(
        `
        INSERT INTO phar_stock_movements (
          shop_id, branch_id, product_id, product_batch_id,
          movement_type, reference_type, reference_id,
          quantity, unit_cost, notes, created_by
        ) VALUES (
          $1::uuid, $2::uuid, $3::uuid, $4::uuid,
          'sales_return', 'sales_return', $5::uuid,
          $6, $7, 'Return reversed', $8::uuid
        )
        `,
        [
          salesReturn?.shop_id ?? null,
          salesReturn?.branch_id ?? null,
          item.product_id,
          item.product_batch_id ?? null,
          returnId,
          -qtyReturnStock,
          this.toNumber(item.unit_price),
          processedBy ?? null,
        ],
      );
    }
  }

  private async getReturnById(id: string, client?: PoolClient) {
    const executor = client ?? this.databaseService;
    const result = await executor.query<SalesReturnRow>(
      `
      SELECT
        sr.*,
        c.name AS customer_name,
        si.invoice_number
      FROM phar_sales_returns sr
      LEFT JOIN phar_companies c ON c.id = sr.customer_id
      LEFT JOIN phar_sales_invoices si ON si.id = sr.sales_invoice_id
      WHERE sr.id = $1::uuid
      LIMIT 1
      `,
      [id],
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Sales return not found for id "${id}"`);
    }
    return this.normalizeReturn(row);
  }

  private async getReturnItems(returnId: string, client?: PoolClient) {
    const executor = client ?? this.databaseService;
    const result = await executor.query(
      `
      SELECT
        sri.*,
        p.name AS product_name,
        p.sku AS product_sku,
        ru.name AS return_unit_name,
        pb.batch_number AS batch_number
      FROM phar_sales_return_items sri
      JOIN phar_products p ON p.id = sri.product_id
      LEFT JOIN phar_product_units ru ON ru.id = sri.return_unit_id
      LEFT JOIN phar_product_batches pb ON pb.id = sri.product_batch_id
      WHERE sri.sales_return_id = $1::uuid
      ORDER BY sri.created_at ASC
      `,
      [returnId],
    );

    return result.rows.map((row) => ({
      ...row,
      return_qty: this.toNumber(row.return_qty),
      qty_return_stock: this.toNumber(row.qty_return_stock),
      converted_rate_used: this.toNumber(row.converted_rate_used),
      unit_price: this.toNumber(row.unit_price),
      line_total: this.toNumber(row.line_total),
    }));
  }

  private async ensureReturnExists(client: PoolClient, id: string) {
    const result = await client.query<SalesReturnRow>(
      `
      SELECT * FROM phar_sales_returns
      WHERE id = $1::uuid
      FOR UPDATE
      LIMIT 1
      `,
      [id],
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Sales return not found for id "${id}"`);
    }
    return row;
  }

  private async getInvoiceForReturn(client: PoolClient, invoiceId: string) {
    const result = await client.query<{
      id: string;
      status: string;
      customer_id: string | null;
      shop_id: string | null;
      branch_id: string | null;
    }>(
      `
      SELECT id, status, customer_id, shop_id, branch_id
      FROM phar_sales_invoices
      WHERE id = $1::uuid
      LIMIT 1
      `,
      [invoiceId],
    );

    const invoice = result.rows[0];
    if (!invoice) {
      throw new NotFoundException(`Sales invoice not found for id "${invoiceId}"`);
    }
    return invoice;
  }

  private async generateReturnNumber(client: PoolClient) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const candidate = `SR-${timestamp}-${random}`;

      const exists = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (SELECT 1 FROM phar_sales_returns WHERE return_number = $1) AS exists`,
        [candidate],
      );

      if (!exists.rows[0]?.exists) return candidate;
    }
    throw new BadRequestException('Failed to generate unique sales return number');
  }

  private normalizeReturn(row: SalesReturnRow) {
    return {
      ...row,
      total_amount: this.toNumber(row.total_amount),
    };
  }

  private ensurePositive(value: number, field: string) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(`${field} must be a positive number`);
    }
    return value;
  }

  private ensureNonNegative(value: number, field: string) {
    if (!Number.isFinite(value) || value < 0) {
      throw new BadRequestException(`${field} must be a non-negative number`);
    }
    return value;
  }

  private toStockQuantity(qty: number, convertRate: number) {
    const raw = qty * convertRate;
    const rounded = Math.round(raw);
    if (Math.abs(raw - rounded) > 0.000001) {
      throw new BadRequestException(
        'Converted stock quantity must be a whole number. Adjust return_qty or convert_rate.',
      );
    }
    return rounded;
  }

  private roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private getPgErrorCode(error: unknown) {
    if (typeof error !== 'object' || error === null) return null;
    if (!('code' in error)) return null;
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
  }

  private handlePgError(error: unknown) {
    const code = this.getPgErrorCode(error);
    if (code === '23505') throw new BadRequestException('Return number already exists');
    if (code === '23503') throw new BadRequestException('Invalid sales invoice, customer, or reference');
    if (code === '22P02') throw new BadRequestException('Invalid UUID or input syntax in sales return data');
    throw error;
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
