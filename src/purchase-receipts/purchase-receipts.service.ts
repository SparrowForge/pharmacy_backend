import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PurchaseService } from '../purchase/purchase.service';
import { CreatePurchaseReceiptDto } from './dto/create-purchase-receipt.dto';
import { UpdatePurchaseReceiptDto } from './dto/update-purchase-receipt.dto';
import { ListBasicQueryDto } from '../basic/dto/list-basic-query.dto';

@Injectable()
export class PurchaseReceiptsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly purchaseService: PurchaseService,
  ) {}

  async list(query: ListBasicQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const where: string[] = [];
    const params: unknown[] = [];

    if (query.q?.trim()) {
      params.push(`%${query.q.trim()}%`);
      where.push(`receipt_number ILIKE $${params.length} OR notes ILIKE $${params.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await this.databaseService.query<{ total: number }>(
      `
      SELECT COUNT(*)::int AS total
      FROM phar_purchase_receipts
      ${whereClause}
      `,
      params,
    );

    const dataResult = await this.databaseService.query(
      `
      SELECT *
      FROM phar_purchase_receipts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, limit, offset],
    );

    return {
      entity: 'purchase_receipts',
      page,
      limit,
      total: countResult.rows[0]?.total ?? 0,
      data: dataResult.rows,
    };
  }

  async create(dto: CreatePurchaseReceiptDto, receivedBy?: string) {
    if (!dto.purchase_order_id) {
      throw new BadRequestException('purchase_order_id is required');
    }

    return this.purchaseService.receive(dto.purchase_order_id, dto, receivedBy);
  }

  async getById(id: string) {
    const receiptResult = await this.databaseService.query(
      `
      SELECT *
      FROM phar_purchase_receipts
      WHERE id = $1::uuid
      LIMIT 1
      `,
      [id],
    );

    const receipt = receiptResult.rows[0];
    if (!receipt) {
      throw new NotFoundException(`Purchase receipt not found for id "${id}"`);
    }

    const itemsResult = await this.databaseService.query(
      `
      SELECT pri.*, p.name AS product_name, pb.batch_number AS batch_number, pu.name AS purchase_unit_name
      FROM phar_purchase_receipt_items pri
      JOIN phar_products p ON p.id = pri.product_id
      LEFT JOIN phar_product_batches pb ON pb.id = pri.product_batch_id
      LEFT JOIN phar_product_units pu ON pu.id = pri.purchase_unit_id
      WHERE pri.purchase_receipt_id = $1::uuid
      ORDER BY pri.created_at ASC
      `,
      [id],
    );

    return {
      ...receipt,
      items: itemsResult.rows.map((item: Record<string, unknown>) => this.mapItemNumbers(item)),
    };
  }

  async listAvailableItemsByProduct(productId: string) {
    const itemsResult = await this.databaseService.query(
      `
      SELECT * FROM (
        SELECT DISTINCT ON (pri.product_batch_id)
               pri.*, p.name AS product_name, pb.batch_number AS batch_number,
               pu.name AS purchase_unit_name,
               pb.selling_price,
               pb.quantity_on_hand AS available_stock
        FROM phar_purchase_receipt_items pri
        JOIN phar_products p ON p.id = pri.product_id
        JOIN phar_product_batches pb ON pb.id = pri.product_batch_id
        LEFT JOIN phar_product_units pu ON pu.id = pri.purchase_unit_id
        WHERE pri.product_id = $1::uuid
          AND COALESCE(pb.is_delete, FALSE) = FALSE
          AND pb.quantity_on_hand > 0
        ORDER BY pri.product_batch_id, pri.created_at DESC
      ) t
      ORDER BY t.created_at ASC
      `,
      [productId],
    );

    return {
      product_id: productId,
      items: itemsResult.rows.map((item: Record<string, unknown>) => ({
        ...this.mapItemNumbers(item),
        selling_price: item.selling_price === null ? null : Number(item.selling_price),
        available_stock: item.available_stock === null ? null : Number(item.available_stock),
      })),
    };
  }

  private mapItemNumbers(item: Record<string, unknown>) {
    return {
      ...item,
      unit_cost: item.unit_cost === null ? null : Number(item.unit_cost),
      line_total: item.line_total === null ? null : Number(item.line_total),
      quantity_received_purchase:
        item.quantity_received_purchase === null ? null : Number(item.quantity_received_purchase),
      quantity_received_stock:
        item.quantity_received_stock === null ? null : Number(item.quantity_received_stock),
      convert_rate_used:
        item.convert_rate_used === null ? null : Number(item.convert_rate_used),
    };
  }

  async update(id: string, dto: UpdatePurchaseReceiptDto) {
    const set: string[] = [];
    const values: unknown[] = [];

    const assign = (column: string, value: unknown) => {
      values.push(value);
      set.push(`${column} = $${values.length}`);
    };

    if (dto.receipt_number !== undefined) assign('receipt_number', dto.receipt_number);
    if (dto.received_at !== undefined) assign('received_at', dto.received_at);
    if (dto.status !== undefined) assign('status', dto.status);
    if (dto.notes !== undefined) assign('notes', dto.notes);

    if (set.length === 0) {
      throw new BadRequestException('No updatable fields provided');
    }

    values.push(id);
    const result = await this.databaseService.query(
      `
      UPDATE phar_purchase_receipts
      SET ${set.join(', ')}
      WHERE id = $${values.length}::uuid
      RETURNING *
      `,
      values,
    );

    if (!result.rows[0]) {
      throw new NotFoundException(`Purchase receipt not found for id "${id}"`);
    }

    return result.rows[0];
  }

  async softDelete(id: string) {
    await this.ensureReceiptExists(id);

    await this.databaseService.query(
      `
      UPDATE phar_purchase_receipts
      SET status = 'cancelled'
      WHERE id = $1::uuid
      `,
      [id],
    );

    return {
      message: 'Purchase receipt soft deleted successfully',
      id,
    };
  }

  async permanentDelete(id: string) {
    await this.ensureReceiptExists(id);

    await this.databaseService.query(
      `
      DELETE FROM phar_purchase_receipts
      WHERE id = $1::uuid
      `,
      [id],
    );

    return {
      message: 'Permanently deleted purchase receipt successfully',
      id,
    };
  }

  private async ensureReceiptExists(id: string) {
    const result = await this.databaseService.query(
      `
      SELECT id
      FROM phar_purchase_receipts
      WHERE id = $1::uuid
      LIMIT 1
      `,
      [id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException(`Purchase receipt not found for id "${id}"`);
    }
  }
}
