import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PoolClient, QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';
import { AddPurchaseOrderItemDto } from './dto/add-purchase-order-item.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';
import { ListPurchaseOrdersQueryDto } from './dto/list-purchase-orders-query.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { UpdatePurchaseOrderItemDto } from './dto/update-purchase-order-item.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

type PurchaseOrderRow = QueryResultRow & {
  id: string;
  po_number: string;
  supplier_id: string;
  shop_id: string | null;
  branch_id: string | null;
  status: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  shipping_cost: string;
  total_amount: string;
  phar_payment_status: string;
  expected_delivery_date: string | null;
  delivery_date: string | null;
  placed_at: string;
  created_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type PurchaseOrderItemRow = QueryResultRow & {
  id: string;
  purchase_order_id: string;
  product_id: string;
  product_batch_id: string | null;
  purchase_unit_id: string | null;
  quantity_purchase: string;
  quantity_stock: number;
  quantity: number;
  quantity_received_purchase: string;
  quantity_received_stock: number;
  quantity_received: number;
  convert_rate_used: string;
  unit_cost: string;
  discount: string;
  tax: string;
  line_total: string;
  expected_expiry_date: string | null;
  batch_number: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    sku: string | null;
    barcode: string | null;
    name: string;
    calling_name: string | null;
    generic_name: string | null;
    description: string | null;
    overview: string | null;
    brand_id: string | null;
    category_id: string | null;
    unit_id: string | null;
    default_unit_id: string | null;
    current_stock: number;
  };
};

type ProductUnitContextRow = QueryResultRow & {
  id: string;
  unit_id: string | null;
  default_unit_id: string | null;
  current_stock: number;
};

type UnitRow = QueryResultRow & {
  id: string;
  convert_rate: string | null;
};

@Injectable()
export class PurchaseService {
  constructor(private readonly databaseService: DatabaseService) {}

  async list(query: ListPurchaseOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const where: string[] = [];
    const params: unknown[] = [];

    if (query.status) {
      params.push(query.status);
      where.push(`po.status = $${params.length}`);
    }

    if (query.supplier_id) {
      params.push(query.supplier_id);
      where.push(`po.supplier_id = $${params.length}::uuid`);
    }

    if (query.q?.trim()) {
      params.push(`%${query.q.trim()}%`);
      where.push(`(po.po_number ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await this.databaseService.query<{ total: number }>(
      `
      SELECT COUNT(*)::int AS total
      FROM phar_purchase_orders po
      JOIN phar_companies c ON c.id = po.supplier_id
      ${whereClause}
      `,
      params,
    );

    const dataResult = await this.databaseService.query(
      `
      SELECT
        po.*,
        c.name AS supplier_name,
        COUNT(poi.id)::int AS item_count,
        COALESCE(SUM(poi.quantity_purchase::float), 0)::float AS totalqty,
        COALESCE(SUM(poi.quantity_received_purchase::float), 0)::float AS totalreceiveqty
      FROM phar_purchase_orders po
      JOIN phar_companies c ON c.id = po.supplier_id
      LEFT JOIN phar_purchase_order_items poi ON poi.purchase_order_id = po.id
      ${whereClause}
      GROUP BY po.id, c.name
      ORDER BY po.created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, limit, offset],
    );

    return {
      entity: 'purchase_orders',
      page,
      limit,
      total: countResult.rows[0]?.total ?? 0,
      data: dataResult.rows,
    };
  }

  async getById(id: string, client?: PoolClient) {
    const order = await this.getOrderById(id, client);
    const items = await this.getOrderItems(id, client);

    return {
      ...order,
      items,
    };
  }

  async create(dto: CreatePurchaseOrderDto, createdBy?: string) {
    return this.databaseService.withTransaction(async (client) => {
      const poNumber = dto.po_number?.trim() || (await this.generatePurchaseOrderNumber(client));

      const insertedOrder = await client.query<PurchaseOrderRow>(
        `
        INSERT INTO phar_purchase_orders (
          po_number,
          supplier_id,
          shop_id,
          branch_id,
          status,
          discount_amount,
          tax_amount,
          shipping_cost,
          phar_payment_status,
          expected_delivery_date,
          delivery_date,
          created_by,
          notes
        ) VALUES (
          $1,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10::date,
          $11::date,
          $12::uuid,
          $13
        )
        RETURNING *
        `,
        [
          poNumber,
          dto.supplier_id,
          dto.shop_id ?? null,
          dto.branch_id ?? null,
          dto.status ?? 'pending',
          dto.discount_amount ?? 0,
          dto.tax_amount ?? 0,
          dto.shipping_cost ?? 0,
          dto.phar_payment_status ?? 'pending',
          dto.expected_delivery_date ?? null,
          dto.delivery_date ?? null,
          createdBy ?? null,
          dto.notes ?? null,
        ],
      );

      const order = insertedOrder.rows[0];

      for (const item of dto.items) {
        await this.insertOrderItem(client, order.id, item);
      }

      await this.recalculateOrderTotals(client, order.id);
      return this.getById(order.id, client);
    });
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    return this.databaseService.withTransaction(async (client) => {
      await this.ensureOrderExists(client, id);

      const set: string[] = [];
      const values: unknown[] = [];
      const assign = (column: string, value: unknown, cast = '') => {
        values.push(value);
        set.push(`${column} = $${values.length}${cast}`);
      };

      if (dto.po_number !== undefined) assign('po_number', dto.po_number);
      if (dto.supplier_id !== undefined) assign('supplier_id', dto.supplier_id, '::uuid');
      if (dto.shop_id !== undefined) assign('shop_id', dto.shop_id ?? null, '::uuid');
      if (dto.branch_id !== undefined) assign('branch_id', dto.branch_id ?? null, '::uuid');
      if (dto.status !== undefined) assign('status', dto.status);
      if (dto.phar_payment_status !== undefined) assign('phar_payment_status', dto.phar_payment_status);
      if (dto.discount_amount !== undefined) assign('discount_amount', dto.discount_amount ?? 0);
      if (dto.tax_amount !== undefined) assign('tax_amount', dto.tax_amount ?? 0);
      if (dto.shipping_cost !== undefined) assign('shipping_cost', dto.shipping_cost ?? 0);
      if (dto.expected_delivery_date !== undefined) {
        assign('expected_delivery_date', dto.expected_delivery_date ?? null, '::date');
      }
      if (dto.delivery_date !== undefined) assign('delivery_date', dto.delivery_date ?? null, '::date');
      if (dto.notes !== undefined) assign('notes', dto.notes ?? null);

      if (set.length > 0) {
        values.push(id);
        await client.query(
          `
          UPDATE phar_purchase_orders
          SET ${set.join(', ')}
          WHERE id = $${values.length}::uuid
          `,
          values,
        );
      }

      await this.recalculateOrderTotals(client, id);
      return this.getById(id, client);
    });
  }

  async addItem(orderId: string, dto: AddPurchaseOrderItemDto) {
    return this.databaseService.withTransaction(async (client) => {
      await this.ensureOrderExists(client, orderId);
      await this.insertOrderItem(client, orderId, dto);
      await this.recalculateOrderTotals(client, orderId);
      return this.getById(orderId, client);
    });
  }

  async updateItem(orderId: string, itemId: string, dto: UpdatePurchaseOrderItemDto) {
    return this.databaseService.withTransaction(async (client) => {
      await this.ensureOrderExists(client, orderId);
      const existing = await this.getOrderItemById(client, orderId, itemId);

      const payload = {
        product_id: dto.product_id ?? existing.product_id,
        product_batch_id: dto.product_batch_id ?? existing.product_batch_id ?? undefined,
        purchase_unit_id: dto.purchase_unit_id ?? existing.purchase_unit_id ?? undefined,
        quantity_purchase:
          dto.quantity_purchase !== undefined
            ? dto.quantity_purchase
            : this.toNumber(existing.quantity_purchase),
        unit_cost: dto.unit_cost !== undefined ? dto.unit_cost : this.toNumber(existing.unit_cost),
        discount: dto.discount !== undefined ? dto.discount : this.toNumber(existing.discount),
        tax: dto.tax !== undefined ? dto.tax : this.toNumber(existing.tax),
        expected_expiry_date: dto.expected_expiry_date ?? existing.expected_expiry_date ?? undefined,
        batch_number: dto.batch_number ?? existing.batch_number ?? undefined,
      };

      const resolved = await this.resolveOrderItem(client, payload);

      const currentReceivedPurchase = this.toNumber(existing.quantity_received_purchase);
      if (currentReceivedPurchase > resolved.quantityPurchase + 0.000001) {
        throw new BadRequestException(
          'quantity_purchase cannot be lower than already received purchase quantity',
        );
      }

      if (existing.quantity_received_stock > resolved.quantityStock) {
        throw new BadRequestException(
          'quantity_stock cannot be lower than already received stock quantity',
        );
      }

      await client.query(
        `
        UPDATE phar_purchase_order_items
        SET
          product_id = $1::uuid,
          product_batch_id = $2::uuid,
          purchase_unit_id = $3::uuid,
          quantity_purchase = $4,
          quantity_stock = $5,
          quantity = $6,
          convert_rate_used = $7,
          unit_cost = $8,
          discount = $9,
          tax = $10,
          line_total = $11,
          expected_expiry_date = $12::date,
          batch_number = $13
        WHERE id = $14::uuid
          AND purchase_order_id = $15::uuid
        `,
        [
          resolved.productId,
          resolved.productBatchId ?? null,
          resolved.purchaseUnitId,
          resolved.quantityPurchase,
          resolved.quantityStock,
          resolved.quantityStock,
          resolved.convertRate,
          resolved.unitCost,
          resolved.discount,
          resolved.tax,
          resolved.lineTotal,
          resolved.expectedExpiryDate ?? null,
          resolved.batchNumber ?? null,
          itemId,
          orderId,
        ],
      );

      await this.recalculateOrderTotals(client, orderId);
      await this.syncOrderReceiptStatus(client, orderId);
      return this.getById(orderId, client);
    });
  }

  async removeItem(orderId: string, itemId: string) {
    return this.databaseService.withTransaction(async (client) => {
      await this.ensureOrderExists(client, orderId);
      const item = await this.getOrderItemById(client, orderId, itemId);

      if (item.quantity_received_stock > 0) {
        throw new BadRequestException(
          'Cannot delete an item that already has received stock',
        );
      }

      await client.query(
        `
        DELETE FROM phar_purchase_order_items
        WHERE id = $1::uuid
          AND purchase_order_id = $2::uuid
        `,
        [itemId, orderId],
      );

      await this.recalculateOrderTotals(client, orderId);
      await this.syncOrderReceiptStatus(client, orderId);
      return this.getById(orderId, client);
    });
  }

  async receive(orderId: string, dto: ReceivePurchaseOrderDto, receivedBy?: string) {
    return this.databaseService.withTransaction(async (client) => {
      const order = await this.ensureOrderExists(client, orderId);

      const receiptNumber = dto.receipt_number?.trim() || (await this.generateReceiptNumber(client));
      const receiptResult = await client.query<{ id: string }>(
        `
        INSERT INTO phar_purchase_receipts (
          receipt_number,
          purchase_order_id,
          received_at,
          received_by,
          status,
          total_amount,
          notes
        ) VALUES (
          $1,
          $2::uuid,
          COALESCE($3::timestamptz, now()),
          $4::uuid,
          $5,
          0,
          $6
        )
        RETURNING id
        `,
        [
          receiptNumber,
          orderId,
          dto.received_at ?? null,
          receivedBy ?? null,
          dto.status ?? 'received',
          dto.notes ?? null,
        ],
      );

      const receiptId = receiptResult.rows[0].id;
      let totalAmount = 0;

      for (const itemDto of dto.items) {
        const poItem = await this.getOrderItemById(client, orderId, itemDto.purchase_order_item_id, true);

        const quantityPurchase = this.ensurePositive(itemDto.quantity_purchase, 'quantity_purchase');
        const remainingPurchase =
          this.toNumber(poItem.quantity_purchase) - this.toNumber(poItem.quantity_received_purchase);

        if (quantityPurchase > remainingPurchase + 0.000001) {
          throw new BadRequestException(
            `Received purchase quantity exceeds remaining quantity for item ${poItem.id}`,
          );
        }

        const quantityStock = this.toStockQuantity(
          quantityPurchase,
          this.toNumber(poItem.convert_rate_used),
        );
        const remainingStock = poItem.quantity_stock - poItem.quantity_received_stock;

        if (quantityStock > remainingStock) {
          throw new BadRequestException(
            `Received stock quantity exceeds remaining stock quantity for item ${poItem.id}`,
          );
        }

        const unitCost =
          itemDto.unit_cost !== undefined
            ? this.ensureNonNegative(itemDto.unit_cost, 'unit_cost')
            : this.toNumber(poItem.unit_cost);

        const lineTotal = this.roundMoney(quantityPurchase * unitCost);
        totalAmount += lineTotal;

        const resolvedBatchId = await this.resolveReceiptBatchId(client, {
          existingBatchId: itemDto.product_batch_id ?? poItem.product_batch_id ?? undefined,
          productId: poItem.product_id,
          batchNumber: itemDto.lot_number ?? poItem.batch_number ?? undefined,
          unitCost,
          quantityStock,
          expiryDate: itemDto.expiry_date,
        });

        await client.query(
          `
          INSERT INTO phar_purchase_receipt_items (
            purchase_receipt_id,
            purchase_order_item_id,
            product_id,
            product_batch_id,
            purchase_unit_id,
            quantity_received_purchase,
            quantity_received_stock,
            quantity_received,
            convert_rate_used,
            unit_cost,
            expiry_date,
            lot_number,
            line_total
          ) VALUES (
            $1::uuid,
            $2::uuid,
            $3::uuid,
            $4::uuid,
            $5::uuid,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11::date,
            $12,
            $13
          )
          `,
          [
            receiptId,
            poItem.id,
            poItem.product_id,
            resolvedBatchId ?? null,
            poItem.purchase_unit_id,
            quantityPurchase,
            quantityStock,
            quantityStock,
            this.toNumber(poItem.convert_rate_used),
            unitCost,
            itemDto.expiry_date ?? null,
            itemDto.lot_number ?? null,
            lineTotal,
          ],
        );

        const updatedReceivedPurchase =
          this.toNumber(poItem.quantity_received_purchase) + quantityPurchase;
        const updatedReceivedStock = poItem.quantity_received_stock + quantityStock;

        await client.query(
          `
          UPDATE phar_purchase_order_items
          SET
            quantity_received_purchase = $1,
            quantity_received_stock = $2,
            quantity_received = $3
          WHERE id = $4::uuid
          `,
          [updatedReceivedPurchase, updatedReceivedStock, updatedReceivedStock, poItem.id],
        );

        await client.query(
          `
          UPDATE phar_products
          SET current_stock = current_stock + $1
          WHERE id = $2::uuid
          `,
          [quantityStock, poItem.product_id],
        );

        await client.query(
          `
          INSERT INTO phar_stock_movements (
            shop_id,
            branch_id,
            product_id,
            product_batch_id,
            movement_type,
            reference_type,
            reference_id,
            quantity,
            unit_cost,
            notes,
            created_by
          ) VALUES (
            $1::uuid,
            $2::uuid,
            $3::uuid,
            $4::uuid,
            'purchase_receipt',
            'purchase_receipt',
            $5::uuid,
            $6,
            $7,
            $8,
            $9::uuid
          )
          `,
          [
            order.shop_id ?? null,
            order.branch_id ?? null,
            poItem.product_id,
            resolvedBatchId ?? null,
            receiptId,
            quantityStock,
            unitCost,
            dto.notes ?? null,
            receivedBy ?? null,
          ],
        );
      }

      await client.query(
        `
        UPDATE phar_purchase_receipts
        SET total_amount = $1
        WHERE id = $2::uuid
        `,
        [this.roundMoney(totalAmount), receiptId],
      );

      await this.syncOrderReceiptStatus(client, orderId);

      const receipt = await client.query(
        `
        SELECT *
        FROM phar_purchase_receipts
        WHERE id = $1::uuid
        LIMIT 1
        `,
        [receiptId],
      );

      return {
        message: 'Purchase receipt processed successfully',
        receipt: receipt.rows[0],
        order: await this.getById(orderId),
      };
    });
  }

  async processReturn(orderId: string, dto: CreatePurchaseReturnDto, processedBy?: string) {
    return this.databaseService.withTransaction(async (client) => {
      const order = await this.ensureOrderExists(client, orderId);
      const returnStatus = dto.status ?? 'completed';

      if (returnStatus !== 'completed') {
        throw new BadRequestException(
          'status must be "completed" when processing a purchase return',
        );
      }

      const returnNumber = dto.return_number?.trim() || (await this.generateReturnNumber(client));
      const returnResult = await client.query<{ id: string }>(
        `
        INSERT INTO phar_purchase_returns (
          return_number,
          purchase_order_id,
          supplier_id,
          shop_id,
          branch_id,
          status,
          total_amount,
          reason,
          notes,
          created_by,
          processed_by,
          processed_at
        ) VALUES (
          $1,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5::uuid,
          $6,
          0,
          $7,
          $8,
          $9::uuid,
          $10::uuid,
          $11::timestamptz
        )
        RETURNING id
        `,
        [
          returnNumber,
          orderId,
          order.supplier_id,
          order.shop_id ?? null,
          order.branch_id ?? null,
          returnStatus,
          dto.reason ?? null,
          dto.notes ?? null,
          processedBy ?? null,
          processedBy ?? null,
          new Date().toISOString(),
        ],
      );

      const purchaseReturnId = returnResult.rows[0].id;
      let totalAmount = 0;

      for (const itemDto of dto.items) {
        const poItem = await this.getOrderItemById(
          client,
          orderId,
          itemDto.purchase_order_item_id,
          true,
        );

        const product = await this.getProductUnitContext(client, poItem.product_id, true);
        if (!product.unit_id) {
          throw new BadRequestException(`Product "${poItem.product_id}" has no stock unit_id`);
        }

        const returnQty = this.ensurePositive(itemDto.return_qty, 'return_qty');
        const returnUnitId =
          itemDto.return_unit_id ?? poItem.purchase_unit_id ?? product.default_unit_id ?? product.unit_id;
        const convertRate = await this.resolveConvertRate(
          client,
          product.unit_id,
          returnUnitId,
          'return',
        );
        const stockReturnQty = this.toStockQuantity(returnQty, convertRate);

        if ((product.current_stock ?? 0) < stockReturnQty) {
          throw new BadRequestException(
            `Insufficient stock for product "${poItem.product_id}". Required ${stockReturnQty}, available ${product.current_stock ?? 0}`,
          );
        }

        const returnBatchId = itemDto.product_batch_id ?? poItem.product_batch_id ?? null;
        if (returnBatchId) {
          const batchResult = await client.query<{ id: string; quantity_on_hand: number }>(
            `
            SELECT id, quantity_on_hand
            FROM phar_product_batches
            WHERE id = $1::uuid
              AND product_id = $2::uuid
            FOR UPDATE
            LIMIT 1
            `,
            [returnBatchId, poItem.product_id],
          );

          const batch = batchResult.rows[0];
          if (!batch) {
            throw new NotFoundException(
              `Product batch "${returnBatchId}" not found for product "${poItem.product_id}"`,
            );
          }

          if ((batch.quantity_on_hand ?? 0) < stockReturnQty) {
            throw new BadRequestException(
              `Insufficient batch stock for batch "${returnBatchId}". Required ${stockReturnQty}, available ${batch.quantity_on_hand ?? 0}`,
            );
          }

          await client.query(
            `
            UPDATE phar_product_batches
            SET quantity_on_hand = quantity_on_hand - $1
            WHERE id = $2::uuid
            `,
            [stockReturnQty, returnBatchId],
          );
        }

        const unitCost =
          itemDto.unit_cost !== undefined
            ? this.ensureNonNegative(itemDto.unit_cost, 'unit_cost')
            : this.toNumber(poItem.unit_cost);
        const lineTotal = this.roundMoney(returnQty * unitCost);
        totalAmount += lineTotal;

        await client.query(
          `
          INSERT INTO phar_purchase_return_items (
            purchase_return_id,
            product_id,
            product_batch_id,
            return_unit_id,
            return_qty,
            qty_return_stock,
            converted_rate_used,
            quantity,
            unit_cost,
            line_total,
            reason
          ) VALUES (
            $1::uuid,
            $2::uuid,
            $3::uuid,
            $4::uuid,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11
          )
          `,
          [
            purchaseReturnId,
            poItem.product_id,
            returnBatchId,
            returnUnitId,
            returnQty,
            stockReturnQty,
            convertRate,
            stockReturnQty,
            unitCost,
            lineTotal,
            itemDto.reason ?? null,
          ],
        );

        await client.query(
          `
          UPDATE phar_products
          SET current_stock = current_stock - $1
          WHERE id = $2::uuid
          `,
          [stockReturnQty, poItem.product_id],
        );

        await client.query(
          `
          INSERT INTO phar_stock_movements (
            shop_id,
            branch_id,
            product_id,
            product_batch_id,
            movement_type,
            reference_type,
            reference_id,
            quantity,
            unit_cost,
            notes,
            created_by
          ) VALUES (
            $1::uuid,
            $2::uuid,
            $3::uuid,
            $4::uuid,
            'purchase_return',
            'purchase_return',
            $5::uuid,
            $6,
            $7,
            $8,
            $9::uuid
          )
          `,
          [
            order.shop_id ?? null,
            order.branch_id ?? null,
            poItem.product_id,
            returnBatchId,
            purchaseReturnId,
            -stockReturnQty,
            unitCost,
            itemDto.reason ?? dto.notes ?? null,
            processedBy ?? null,
          ],
        );
      }

      await client.query(
        `
        UPDATE phar_purchase_returns
        SET total_amount = $1
        WHERE id = $2::uuid
        `,
        [this.roundMoney(totalAmount), purchaseReturnId],
      );

      const purchaseReturnResult = await client.query(
        `
        SELECT *
        FROM phar_purchase_returns
        WHERE id = $1::uuid
        LIMIT 1
        `,
        [purchaseReturnId],
      );

      return {
        message: 'Purchase return processed successfully',
        purchase_return: purchaseReturnResult.rows[0],
        order: await this.getById(orderId, client),
      };
    });
  }

  private async insertOrderItem(
    client: PoolClient,
    orderId: string,
    input: AddPurchaseOrderItemDto,
  ) {
    const resolved = await this.resolveOrderItem(client, input);

    await client.query(
      `
      INSERT INTO phar_purchase_order_items (
        purchase_order_id,
        product_id,
        product_batch_id,
        purchase_unit_id,
        quantity_purchase,
        quantity_stock,
        quantity,
        quantity_received_purchase,
        quantity_received_stock,
        quantity_received,
        convert_rate_used,
        unit_cost,
        discount,
        tax,
        line_total,
        expected_expiry_date,
        batch_number
      ) VALUES (
        $1::uuid,
        $2::uuid,
        $3::uuid,
        $4::uuid,
        $5,
        $6,
        $7,
        0,
        0,
        0,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13::date,
        $14
      )
      `,
      [
        orderId,
        resolved.productId,
        resolved.productBatchId ?? null,
        resolved.purchaseUnitId,
        resolved.quantityPurchase,
        resolved.quantityStock,
        resolved.quantityStock,
        resolved.convertRate,
        resolved.unitCost,
        resolved.discount,
        resolved.tax,
        resolved.lineTotal,
        resolved.expectedExpiryDate ?? null,
        resolved.batchNumber ?? null,
      ],
    );
  }

  private async resolveOrderItem(client: PoolClient, input: AddPurchaseOrderItemDto) {
    const quantityPurchase = this.ensurePositive(input.quantity_purchase, 'quantity_purchase');
    const unitCost = this.ensureNonNegative(input.unit_cost, 'unit_cost');
    const discount = this.ensureNonNegative(input.discount ?? 0, 'discount');
    const tax = this.ensureNonNegative(input.tax ?? 0, 'tax');

    const product = await this.getProductUnitContext(client, input.product_id);
    if (!product.unit_id) {
      throw new BadRequestException(`Product "${input.product_id}" has no stock unit_id`);
    }

    const purchaseUnitId = input.purchase_unit_id ?? product.default_unit_id ?? product.unit_id;
    const convertRate = await this.resolveConvertRate(client, product.unit_id, purchaseUnitId);
    const quantityStock = this.toStockQuantity(quantityPurchase, convertRate);
    const lineTotal = this.roundMoney(quantityPurchase * unitCost - discount + tax);

    if (lineTotal < 0) {
      throw new BadRequestException('Line total cannot be negative');
    }

    return {
      productId: input.product_id,
      productBatchId: input.product_batch_id,
      purchaseUnitId,
      quantityPurchase,
      quantityStock,
      convertRate,
      unitCost,
      discount,
      tax,
      lineTotal,
      expectedExpiryDate: input.expected_expiry_date,
      batchNumber: input.batch_number,
    };
  }

  private async resolveConvertRate(
    client: PoolClient,
    stockUnitId: string,
    purchaseUnitId: string,
    unitLabel: 'purchase' | 'return' = 'purchase',
  ) {
    if (stockUnitId === purchaseUnitId) {
      return 1;
    }

    const unitResult = await client.query<UnitRow>(
      `
      SELECT id, convert_rate
      FROM phar_product_units
      WHERE id = $1::uuid
      LIMIT 1
      `,
      [purchaseUnitId],
    );

    const unit = unitResult.rows[0];
    if (!unit) {
      throw new NotFoundException(
        `${unitLabel === 'return' ? 'Return' : 'Purchase'} unit not found for id "${purchaseUnitId}"`,
      );
    }

    const convertRate = this.toNumber(unit.convert_rate);
    if (!(convertRate > 0)) {
      throw new BadRequestException(
        `convert_rate is required and must be > 0 for ${unitLabel} unit "${purchaseUnitId}"`,
      );
    }

    return convertRate;
  }

  private async recalculateOrderTotals(client: PoolClient, orderId: string) {
    const orderResult = await client.query<PurchaseOrderRow>(
      `
      SELECT *
      FROM phar_purchase_orders
      WHERE id = $1::uuid
      LIMIT 1
      `,
      [orderId],
    );
    const order = orderResult.rows[0];
    if (!order) {
      throw new NotFoundException(`Purchase order not found for id "${orderId}"`);
    }

    const itemTotalsResult = await client.query<{ subtotal: string }>(
      `
      SELECT COALESCE(SUM(line_total), 0)::numeric(16,2) AS subtotal
      FROM phar_purchase_order_items
      WHERE purchase_order_id = $1::uuid
      `,
      [orderId],
    );

    const subtotal = this.toNumber(itemTotalsResult.rows[0]?.subtotal);
    const totalAmount = this.roundMoney(
      subtotal -
        this.toNumber(order.discount_amount) +
        this.toNumber(order.tax_amount) +
        this.toNumber(order.shipping_cost),
    );

    await client.query(
      `
      UPDATE phar_purchase_orders
      SET
        subtotal = $1,
        total_amount = $2
      WHERE id = $3::uuid
      `,
      [this.roundMoney(subtotal), totalAmount, orderId],
    );
  }

  private async syncOrderReceiptStatus(client: PoolClient, orderId: string) {
    const currentStatusResult = await client.query<{ status: string }>(
      `
      SELECT status
      FROM phar_purchase_orders
      WHERE id = $1::uuid
      LIMIT 1
      `,
      [orderId],
    );

    const currentStatus = currentStatusResult.rows[0]?.status ?? 'pending';

    const agg = await client.query<{
      total_items: number;
      fully_received_items: number;
      any_received_items: number;
    }>(
      `
      SELECT
        COUNT(*)::int AS total_items,
        COUNT(*) FILTER (WHERE quantity_received_stock >= quantity_stock)::int AS fully_received_items,
        COUNT(*) FILTER (WHERE quantity_received_stock > 0)::int AS any_received_items
      FROM phar_purchase_order_items
      WHERE purchase_order_id = $1::uuid
      `,
      [orderId],
    );

    const totalItems = agg.rows[0]?.total_items ?? 0;
    const fullyReceivedItems = agg.rows[0]?.fully_received_items ?? 0;
    const anyReceivedItems = agg.rows[0]?.any_received_items ?? 0;

    let status = currentStatus;
    if (totalItems > 0 && fullyReceivedItems === totalItems) {
      status = 'received';
    } else if (anyReceivedItems > 0) {
      status = 'partial';
    } else if (currentStatus === 'partial' || currentStatus === 'received') {
      status = 'pending';
    }

    await client.query(
      `
      UPDATE phar_purchase_orders
      SET status = $1
      WHERE id = $2::uuid
      `,
      [status, orderId],
    );
  }

  private async getOrderById(id: string, client?: PoolClient) {
    const executor = client ?? this.databaseService;
    const result = await executor.query<PurchaseOrderRow>(
      `
      SELECT
        po.*,
        c.name AS supplier_name
      FROM phar_purchase_orders po
      JOIN phar_companies c ON c.id = po.supplier_id
      WHERE po.id = $1::uuid
      LIMIT 1
      `,
      [id],
    );

    const order = result.rows[0];
    if (!order) {
      throw new NotFoundException(`Purchase order not found for id "${id}"`);
    }
    return order;
  }

  private async getOrderItems(orderId: string, client?: PoolClient) {
    const executor = client ?? this.databaseService;
    const result = await executor.query<PurchaseOrderItemRow>(
      `
      SELECT
        poi.*,
        json_build_object(
          'id', p.id,
          'sku', p.sku,
          'barcode', p.barcode,
          'name', p.name,
          'calling_name', p.calling_name,
          'generic_name', p.generic_name,
          'description', p.description,
          'overview', p.overview,
          'brand_id', p.brand_id,
          'category_id', p.category_id,
          'unit_id', p.unit_id,
          'default_unit_id', p.default_unit_id,
          'current_stock', p.current_stock
        ) AS product,
        p.name AS product_name,
        p.unit_id AS stock_unit_id,
        p.default_unit_id,
        pu.name AS purchase_unit_name,
        su.name AS stock_unit_name,
        (poi.quantity_stock - poi.quantity_received_stock) AS quantity_stock_remaining,
        (poi.quantity_purchase - poi.quantity_received_purchase) AS quantity_purchase_remaining
      FROM phar_purchase_order_items poi
      JOIN phar_products p ON p.id = poi.product_id
      LEFT JOIN phar_product_units pu ON pu.id = poi.purchase_unit_id
      LEFT JOIN phar_product_units su ON su.id = p.unit_id
      WHERE poi.purchase_order_id = $1::uuid
      ORDER BY poi.created_at ASC
      `,
      [orderId],
    );

    return result.rows.map((row) => ({
      ...row,
      quantity_purchase: this.toNumber(row.quantity_purchase),
      quantity_received_purchase: this.toNumber(row.quantity_received_purchase),
      quantity_purchase_remaining: this.toNumber(row.quantity_purchase_remaining),
    }));
  }

  private async ensureOrderExists(client: PoolClient, id: string) {
    const result = await client.query<PurchaseOrderRow>(
      `
      SELECT *
      FROM phar_purchase_orders
      WHERE id = $1::uuid
      LIMIT 1
      `,
      [id],
    );

    const order = result.rows[0];
    if (!order) {
      throw new NotFoundException(`Purchase order not found for id "${id}"`);
    }
    return order;
  }

  private async getOrderItemById(
    client: PoolClient,
    orderId: string,
    itemId: string,
    forUpdate = false,
  ) {
    const result = await client.query<PurchaseOrderItemRow>(
      `
      SELECT *
      FROM phar_purchase_order_items
      WHERE id = $1::uuid
        AND purchase_order_id = $2::uuid
      ${forUpdate ? 'FOR UPDATE' : ''}
      LIMIT 1
      `,
      [itemId, orderId],
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(
        `Purchase order item not found for order "${orderId}" and item "${itemId}"`,
      );
    }
    return row;
  }

  private async getProductUnitContext(
    client: PoolClient,
    productId: string,
    forUpdate = false,
  ) {
    const productResult = await client.query<ProductUnitContextRow>(
      `
      SELECT id, unit_id, default_unit_id, current_stock
      FROM phar_products
      WHERE id = $1::uuid
      ${forUpdate ? 'FOR UPDATE' : ''}
      LIMIT 1
      `,
      [productId],
    );

    const product = productResult.rows[0];
    if (!product) {
      throw new NotFoundException(`Product not found for id "${productId}"`);
    }
    return product;
  }

  private async generatePurchaseOrderNumber(client: PoolClient) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      const candidate = `PO-${timestamp}-${random}`;

      const exists = await client.query<{ exists: boolean }>(
        `
        SELECT EXISTS (
          SELECT 1
          FROM phar_purchase_orders
          WHERE po_number = $1
        ) AS exists
        `,
        [candidate],
      );

      if (!exists.rows[0]?.exists) {
        return candidate;
      }
    }

    throw new BadRequestException('Failed to generate unique purchase order number');
  }

  private async generateReceiptNumber(client: PoolClient) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      const candidate = `PR-${timestamp}-${random}`;

      const exists = await client.query<{ exists: boolean }>(
        `
        SELECT EXISTS (
          SELECT 1
          FROM phar_purchase_receipts
          WHERE receipt_number = $1
        ) AS exists
        `,
        [candidate],
      );

      if (!exists.rows[0]?.exists) {
        return candidate;
      }
    }

    throw new BadRequestException('Failed to generate unique purchase receipt number');
  }

  private async generateReturnNumber(client: PoolClient) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      const candidate = `RET-${timestamp}-${random}`;

      const exists = await client.query<{ exists: boolean }>(
        `
        SELECT EXISTS (
          SELECT 1
          FROM phar_purchase_returns
          WHERE return_number = $1
        ) AS exists
        `,
        [candidate],
      );

      if (!exists.rows[0]?.exists) {
        return candidate;
      }
    }

    throw new BadRequestException('Failed to generate unique purchase return number');
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

  private toStockQuantity(quantityPurchase: number, convertRate: number) {
    const raw = quantityPurchase * convertRate;
    const rounded = Math.round(raw);
    if (Math.abs(raw - rounded) > 0.000001) {
      throw new BadRequestException(
        'Converted stock quantity must be a whole number. Adjust quantity or convert_rate.',
      );
    }
    return rounded;
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

  private async resolveReceiptBatchId(
    client: PoolClient,
    input: {
      existingBatchId?: string;
      productId: string;
      batchNumber?: string;
      unitCost: number;
      quantityStock: number;
      expiryDate?: string;
    },
  ) {
    if (input.existingBatchId) {
      const existing = await client.query<{ id: string }>(
        `
        SELECT id
        FROM phar_product_batches
        WHERE id = $1::uuid
          AND product_id = $2::uuid
        LIMIT 1
        `,
        [input.existingBatchId, input.productId],
      );

      if (!existing.rows[0]) {
        throw new NotFoundException(
          `Product batch "${input.existingBatchId}" not found for product "${input.productId}"`,
        );
      }

      await client.query(
        `
        UPDATE phar_product_batches
        SET
          quantity_on_hand = quantity_on_hand + $1,
          purchase_price = COALESCE($2, purchase_price),
          expiry_date = COALESCE($3::date, expiry_date),
          received_date = COALESCE(received_date, CURRENT_DATE)
        WHERE id = $4::uuid
        `,
        [input.quantityStock, input.unitCost, input.expiryDate ?? null, input.existingBatchId],
      );

      return input.existingBatchId;
    }

    if (!input.batchNumber?.trim()) {
      return null;
    }

    const batchNumber = input.batchNumber.trim();
    const existingByNumber = await client.query<{ id: string }>(
      `
      SELECT id
      FROM phar_product_batches
      WHERE product_id = $1::uuid
        AND batch_number = $2
      LIMIT 1
      `,
      [input.productId, batchNumber],
    );

    if (existingByNumber.rows[0]) {
      const batchId = existingByNumber.rows[0].id;
      await client.query(
        `
        UPDATE phar_product_batches
        SET
          quantity_on_hand = quantity_on_hand + $1,
          purchase_price = COALESCE($2, purchase_price),
          expiry_date = COALESCE($3::date, expiry_date),
          received_date = COALESCE(received_date, CURRENT_DATE)
        WHERE id = $4::uuid
        `,
        [input.quantityStock, input.unitCost, input.expiryDate ?? null, batchId],
      );
      return batchId;
    }

    const inserted = await client.query<{ id: string }>(
      `
      INSERT INTO phar_product_batches (
        product_id,
        batch_number,
        quantity_on_hand,
        purchase_price,
        received_date,
        expiry_date
      ) VALUES (
        $1::uuid,
        $2,
        $3,
        $4,
        CURRENT_DATE,
        $5::date
      )
      RETURNING id
      `,
      [input.productId, batchNumber, input.quantityStock, input.unitCost, input.expiryDate ?? null],
    );

    return inserted.rows[0]?.id ?? null;
  }
}
