import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PoolClient, QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';
import { AddSalesInvoiceItemDto } from './dto/add-sales-invoice-item.dto';
import { CompleteSalesInvoiceDto } from './dto/complete-sales-invoice.dto';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto';
import { ListSalesInvoicesQueryDto } from './dto/list-sales-invoices-query.dto';
import { CustomerDuePaymentsQueryDto } from './dto/customer-due-payments-query.dto';
import { SalePaymentDto } from './dto/sale-payment.dto';
import { UpdateSalesInvoiceItemDto } from './dto/update-sales-invoice-item.dto';
import { UpdateSalesInvoiceDto } from './dto/update-sales-invoice.dto';

type SalesInvoiceRow = QueryResultRow & {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  shop_id: string | null;
  branch_id: string | null;
  created_by: string | null;
  status: string;
  sale_type: 'cash' | 'credit';
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  paid_amount: string;
  due_amount: string;
  change_amount: string;
  invoice_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type SalesInvoiceItemRow = QueryResultRow & {
  id: string;
  sales_invoice_id: string;
  product_id: string;
  product_batch_id: string | null;
  sales_unit_id: string | null;
  sales_qty: string;
  stock_sales_qty: number;
  quantity: number;
  unit_price: string;
  discount: string;
  tax: string;
  line_total: string;
  created_at: string;
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
export class SalesService {  
  constructor(private readonly databaseService: DatabaseService) {}

  async list(query: ListSalesInvoicesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const where: string[] = [];
    const params: unknown[] = [];

    if (query.status) {
      params.push(query.status);
      where.push(`si.status = $${params.length}`);
    }

    if (query.customer_id) {
      params.push(query.customer_id);
      where.push(`si.customer_id = $${params.length}::uuid`);
    }

    if (query.q?.trim()) {
      params.push(`%${query.q.trim()}%`);
      where.push(
        `(si.invoice_number ILIKE $${params.length} OR COALESCE(c.name, '') ILIKE $${params.length})`,
      );
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await this.databaseService.query<{ total: number }>(
      `
      SELECT COUNT(*)::int AS total
      FROM phar_sales_invoices si
      LEFT JOIN phar_companies c ON c.id = si.customer_id
      ${whereClause}
      `,
      params,
    );

    const dataResult = await this.databaseService.query(
      `
      SELECT
        si.*,
        c.name AS customer_name,
        COUNT(sii.id)::int AS item_count
      FROM phar_sales_invoices si
      LEFT JOIN phar_companies c ON c.id = si.customer_id
      LEFT JOIN phar_sales_invoice_items sii ON sii.sales_invoice_id = si.id
      ${whereClause}
      GROUP BY si.id, c.name
      ORDER BY si.created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, limit, offset],
    );

    return {
      entity: 'sales_invoices',
      page,
      limit,
      total: countResult.rows[0]?.total ?? 0,
      data: dataResult.rows,
    };
  }

  async getById(id: string) {
    const invoice = await this.getInvoiceById(id);
    const [items, payments] = await Promise.all([
      this.getInvoiceItems(id),
      this.getInvoicePayments(id),
    ]);

    return {
      ...invoice,
      items,
      payments,
    };
  }

  async create(dto: CreateSalesInvoiceDto, createdBy?: string) {
    return this.databaseService.withTransaction(async (client) => {
      const requestedStatus = dto.status ?? 'draft';
      const statusForInsert = requestedStatus === 'completed' ? 'draft' : requestedStatus;
      const invoiceNumber =
        dto.invoice_number?.trim() || (await this.generateInvoiceNumber(client));

      const saleType = dto.sale_type ?? 'cash';

      const insertedInvoice = await client.query<SalesInvoiceRow>(
        `
        INSERT INTO phar_sales_invoices (
          invoice_number,
          customer_id,
          shop_id,
          branch_id,
          created_by,
          status,
          sale_type,
          discount_amount,
          tax_amount,
          paid_amount,
          invoice_date,
          notes
        ) VALUES (
          $1,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5::uuid,
          $6,
          $7,
          $8,
          $9,
          $10,
          COALESCE($11::timestamptz, now()),
          $12
        )
        RETURNING *
        `,
        [
          invoiceNumber,
          dto.customer_id ?? null,
          dto.shop_id ?? null,
          dto.branch_id ?? null,
          createdBy ?? null,
          statusForInsert,
          saleType,
          dto.discount_amount ?? 0,
          dto.tax_amount ?? 0,
          dto.paid_amount ?? 0,
          dto.invoice_date ?? null,
          dto.notes ?? null,
        ],
      );

      const invoice = insertedInvoice.rows[0];

      for (const item of dto.items) {
        await this.insertInvoiceItem(client, invoice.id, item);
      }

      await this.recalculateInvoiceTotals(client, invoice.id);

      if (dto.payments?.length) {
        await this.insertSalePayments(client, invoice.id, dto.payments);
      }

      if (requestedStatus === 'completed') {
        // payments already inserted above; pass undefined to avoid double-insert
        await this.applyCompletedSale(client, invoice.id, createdBy, {
          payments: undefined,
          paid_amount: dto.payments?.length ? undefined : dto.paid_amount,
          invoice_date: dto.invoice_date,
          notes: dto.notes,
        });
      }

      return this.getById(invoice.id);
    });
  }

  async update(id: string, dto: UpdateSalesInvoiceDto) {
    return this.databaseService.withTransaction(async (client) => {
      const invoice = await this.ensureInvoiceExists(client, id, true);

      if (invoice.status === 'completed') {
        throw new BadRequestException(
          'Completed invoice cannot be updated. Use payment/adjustment workflow if needed.',
        );
      }

      if (invoice.status === 'cancelled' || invoice.status === 'returned') {
        throw new BadRequestException(`Cannot update invoice with status "${invoice.status}"`);
      }

      if (dto.status === 'completed') {
        throw new BadRequestException('Use /sales_invoices/:id/complete to complete the invoice');
      }

      const set: string[] = [];
      const values: unknown[] = [];
      const assign = (column: string, value: unknown, cast = '') => {
        values.push(value);
        set.push(`${column} = $${values.length}${cast}`);
      };

      if (dto.invoice_number !== undefined) assign('invoice_number', dto.invoice_number);
      if (dto.customer_id !== undefined) assign('customer_id', dto.customer_id ?? null, '::uuid');
      if (dto.shop_id !== undefined) assign('shop_id', dto.shop_id ?? null, '::uuid');
      if (dto.branch_id !== undefined) assign('branch_id', dto.branch_id ?? null, '::uuid');
      if (dto.status !== undefined) assign('status', dto.status);
      if (dto.sale_type !== undefined) assign('sale_type', dto.sale_type);
      if (dto.discount_amount !== undefined) assign('discount_amount', dto.discount_amount ?? 0);
      if (dto.tax_amount !== undefined) assign('tax_amount', dto.tax_amount ?? 0);
      if (dto.paid_amount !== undefined) assign('paid_amount', dto.paid_amount ?? 0);
      if (dto.invoice_date !== undefined) assign('invoice_date', dto.invoice_date ?? null, '::timestamptz');
      if (dto.notes !== undefined) assign('notes', dto.notes ?? null);

      if (set.length > 0) {
        values.push(id);
        await client.query(
          `
          UPDATE phar_sales_invoices
          SET ${set.join(', ')}
          WHERE id = $${values.length}::uuid
          `,
          values,
        );
      }

      await this.recalculateInvoiceTotals(client, id);
      return this.getById(id);
    });
  }

  async addItem(invoiceId: string, dto: AddSalesInvoiceItemDto) {
    return this.databaseService.withTransaction(async (client) => {
      const invoice = await this.ensureInvoiceExists(client, invoiceId, true);
      this.ensureInvoiceMutableForItems(invoice);
      await this.insertInvoiceItem(client, invoiceId, dto);
      await this.recalculateInvoiceTotals(client, invoiceId);
      return this.getById(invoiceId);
    });
  }

  async updateItem(invoiceId: string, itemId: string, dto: UpdateSalesInvoiceItemDto) {
    return this.databaseService.withTransaction(async (client) => {
      const invoice = await this.ensureInvoiceExists(client, invoiceId, true);
      this.ensureInvoiceMutableForItems(invoice);

      const existing = await this.getInvoiceItemById(client, invoiceId, itemId);

      const payload = {
        product_id: dto.product_id ?? existing.product_id,
        product_batch_id: dto.product_batch_id ?? existing.product_batch_id ?? undefined,
        sales_unit_id: dto.sales_unit_id ?? existing.sales_unit_id ?? undefined,
        sales_qty:
          dto.sales_qty !== undefined ? dto.sales_qty : this.toNumber(existing.sales_qty),
        unit_price:
          dto.unit_price !== undefined ? dto.unit_price : this.toNumber(existing.unit_price),
        discount: dto.discount !== undefined ? dto.discount : this.toNumber(existing.discount),
        tax: dto.tax !== undefined ? dto.tax : this.toNumber(existing.tax),
      };

      const resolved = await this.resolveInvoiceItem(client, payload);

      await client.query(
        `
        UPDATE phar_sales_invoice_items
        SET
          product_id = $1::uuid,
          product_batch_id = $2::uuid,
          sales_unit_id = $3::uuid,
          sales_qty = $4,
          stock_sales_qty = $5,
          quantity = $6,
          unit_price = $7,
          discount = $8,
          tax = $9,
          line_total = $10
        WHERE id = $11::uuid
          AND sales_invoice_id = $12::uuid
        `,
        [
          resolved.productId,
          resolved.productBatchId ?? null,
          resolved.salesUnitId,
          resolved.salesQty,
          resolved.stockSalesQty,
          resolved.stockSalesQty,
          resolved.unitPrice,
          resolved.discount,
          resolved.tax,
          resolved.lineTotal,
          itemId,
          invoiceId,
        ],
      );

      await this.recalculateInvoiceTotals(client, invoiceId);
      return this.getById(invoiceId);
    });
  }

  async removeItem(invoiceId: string, itemId: string) {
    return this.databaseService.withTransaction(async (client) => {
      const invoice = await this.ensureInvoiceExists(client, invoiceId, true);
      this.ensureInvoiceMutableForItems(invoice);
      await this.getInvoiceItemById(client, invoiceId, itemId);

      await client.query(
        `
        DELETE FROM phar_sales_invoice_items
        WHERE id = $1::uuid
          AND sales_invoice_id = $2::uuid
        `,
        [itemId, invoiceId],
      );

      await this.recalculateInvoiceTotals(client, invoiceId);
      return this.getById(invoiceId);
    });
  }

  async addPaymentToInvoice(invoiceId: string, payments: SalePaymentDto[], receivedBy?: string) {
    return this.databaseService.withTransaction(async (client) => {
      const invoice = await this.ensureInvoiceExists(client, invoiceId, true);

      if (invoice.sale_type !== 'credit') {
        throw new BadRequestException(
          'Payments can only be added to credit invoices. Cash invoices are fully settled on completion.',
        );
      }

      if (invoice.status !== 'completed') {
        throw new BadRequestException(
          'Payments can only be recorded on completed invoices. Complete the invoice first.',
        );
      }

      const dueAmount = this.toNumber(invoice.due_amount);
      if (dueAmount <= 0) {
        throw new BadRequestException('This invoice has no outstanding balance.');
      }

      const totalPaymentAmount = payments.reduce((sum, p) => sum + this.toNumber(p.amount), 0);
      if (totalPaymentAmount > dueAmount + 0.001) {
        throw new BadRequestException(
          `Total payment amount (${this.roundMoney(totalPaymentAmount)}) exceeds outstanding due amount (${dueAmount})`,
        );
      }

      await this.insertSalePayments(client, invoiceId, payments, receivedBy);
      await this.recalculateInvoiceTotals(client, invoiceId);

      return this.getById(invoiceId);
    });
  }

  async getCustomerDuePayments(customerId: string, query: CustomerDuePaymentsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const countResult = await this.databaseService.query<{ total: number }>(
      `
      SELECT COUNT(*)::int AS total
      FROM phar_sales_invoices
      WHERE customer_id = $1::uuid
        AND sale_type = 'credit'
        AND status = 'completed'
        AND due_amount > 0
      `,
      [customerId],
    );

    const dataResult = await this.databaseService.query(
      `
      SELECT
        si.id,
        si.invoice_number,
        si.invoice_date,
        si.sale_type,
        si.total_amount,
        si.paid_amount,
        si.due_amount,
        si.status,
        si.notes,
        si.created_at,
        c.name AS customer_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', sp.id,
              'payment_number', sp.payment_number,
              'payment_method_id', sp.payment_method_id,
              'payment_method_name', pm.name,
              'amount', sp.amount,
              'status', sp.status,
              'paid_at', sp.paid_at,
              'notes', sp.notes
            ) ORDER BY sp.created_at ASC
          ) FILTER (WHERE sp.id IS NOT NULL),
          '[]'
        ) AS payments
      FROM phar_sales_invoices si
      LEFT JOIN phar_companies c ON c.id = si.customer_id
      LEFT JOIN phar_sale_payments sp ON sp.invoice_id = si.id
      LEFT JOIN phar_payment_methods pm ON pm.id = sp.payment_method_id
      WHERE si.customer_id = $1::uuid
        AND si.sale_type = 'credit'
        AND si.status = 'completed'
        AND si.due_amount > 0
      GROUP BY si.id, c.name
      ORDER BY si.invoice_date DESC
      LIMIT $2
      OFFSET $3
      `,
      [customerId, limit, offset],
    );

    const total = countResult.rows[0]?.total ?? 0;
    const rows = dataResult.rows.map((row) => ({
      ...row,
      total_amount: this.toNumber(row.total_amount),
      paid_amount: this.toNumber(row.paid_amount),
      due_amount: this.toNumber(row.due_amount),
    }));

    const totalDue = rows.reduce((sum, r) => sum + r.due_amount, 0);

    return {
      customer_id: customerId,
      page,
      limit,
      total,
      total_due: this.roundMoney(totalDue),
      data: rows,
    };
  }

  async complete(id: string, dto: CompleteSalesInvoiceDto, completedBy?: string) {
    return this.databaseService.withTransaction(async (client) => {
      await this.applyCompletedSale(client, id, completedBy, dto);
      return {
        message: 'Sales invoice completed successfully',
        invoice: await this.getById(id),
      };
    });
  }

  private async insertInvoiceItem(
    client: PoolClient,
    invoiceId: string,
    input: AddSalesInvoiceItemDto,
  ) {
    const resolved = await this.resolveInvoiceItem(client, input);

    await client.query(
      `
      INSERT INTO phar_sales_invoice_items (
        sales_invoice_id,
        product_id,
        product_batch_id,
        sales_unit_id,
        sales_qty,
        stock_sales_qty,
        quantity,
        unit_price,
        discount,
        tax,
        line_total
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
        invoiceId,
        resolved.productId,
        resolved.productBatchId ?? null,
        resolved.salesUnitId,
        resolved.salesQty,
        resolved.stockSalesQty,
        resolved.stockSalesQty,
        resolved.unitPrice,
        resolved.discount,
        resolved.tax,
        resolved.lineTotal,
      ],
    );
  }

  private async resolveInvoiceItem(client: PoolClient, input: AddSalesInvoiceItemDto) {
    const salesQty = this.ensurePositive(input.sales_qty, 'sales_qty');
    const unitPrice = this.ensureNonNegative(input.unit_price, 'unit_price');
    const discount = this.ensureNonNegative(input.discount ?? 0, 'discount');
    const tax = this.ensureNonNegative(input.tax ?? 0, 'tax');

    const product = await this.getProductUnitContext(client, input.product_id);
    if (!product.unit_id) {
      throw new BadRequestException(`Product "${input.product_id}" has no stock unit_id`);
    }

    const salesUnitId = input.sales_unit_id ?? product.default_unit_id ?? product.unit_id;
    const convertRate = await this.resolveConvertRate(client, product.unit_id, salesUnitId);
    const stockSalesQty = this.toStockQuantity(salesQty, convertRate);
    const lineTotal = this.roundMoney(salesQty * unitPrice - discount + tax);

    if (lineTotal < 0) {
      throw new BadRequestException('Line total cannot be negative');
    }

    return {
      productId: input.product_id,
      productBatchId: input.product_batch_id,
      salesUnitId,
      salesQty,
      stockSalesQty,
      unitPrice,
      discount,
      tax,
      lineTotal,
    };
  }

  private async resolveConvertRate(client: PoolClient, stockUnitId: string, salesUnitId: string) {
    if (stockUnitId === salesUnitId) {
      return 1;
    }

    const unitResult = await client.query<UnitRow>(
      `
      SELECT id, convert_rate
      FROM phar_product_units
      WHERE id = $1::uuid
      LIMIT 1
      `,
      [salesUnitId],
    );

    const unit = unitResult.rows[0];
    if (!unit) {
      throw new NotFoundException(`Sales unit not found for id "${salesUnitId}"`);
    }

    const convertRate = this.toNumber(unit.convert_rate);
    if (!(convertRate > 0)) {
      throw new BadRequestException(
        `convert_rate is required and must be > 0 for sales unit "${salesUnitId}"`,
      );
    }

    return convertRate;
  }

  private async recalculateInvoiceTotals(client: PoolClient, invoiceId: string) {
    const invoiceResult = await client.query<SalesInvoiceRow>(
      `
      SELECT *
      FROM phar_sales_invoices
      WHERE id = $1::uuid
      LIMIT 1
      `,
      [invoiceId],
    );
    const invoice = invoiceResult.rows[0];
    if (!invoice) {
      throw new NotFoundException(`Sales invoice not found for id "${invoiceId}"`);
    }

    const itemTotalsResult = await client.query<{ subtotal: string }>(
      `
      SELECT COALESCE(SUM(line_total), 0)::numeric(16,2) AS subtotal
      FROM phar_sales_invoice_items
      WHERE sales_invoice_id = $1::uuid
      `,
      [invoiceId],
    );

    const subtotal = this.toNumber(itemTotalsResult.rows[0]?.subtotal);
    const totalAmount = this.roundMoney(
      subtotal - this.toNumber(invoice.discount_amount) + this.toNumber(invoice.tax_amount),
    );

    if (totalAmount < 0) {
      throw new BadRequestException('Invoice total cannot be negative');
    }

    let paidAmount = this.toNumber(invoice.paid_amount);

    // Cash sales are always fully paid
    if (invoice.sale_type === 'cash') {
      paidAmount = totalAmount;
    }

    if (paidAmount > totalAmount + 0.001) {
      throw new BadRequestException(
        `Paid amount (${paidAmount}) cannot exceed total amount (${totalAmount})`,
      );
    }

    const dueAmount = this.roundMoney(Math.max(totalAmount - paidAmount, 0));
    const changeAmount = this.roundMoney(Math.max(paidAmount - totalAmount, 0));

    await client.query(
      `
      UPDATE phar_sales_invoices
      SET
        subtotal = $1,
        total_amount = $2,
        paid_amount = $3,
        due_amount = $4,
        change_amount = $5
      WHERE id = $6::uuid
      `,
      [this.roundMoney(subtotal), totalAmount, this.roundMoney(paidAmount), dueAmount, changeAmount, invoiceId],
    );
  }

  private async applyCompletedSale(
    client: PoolClient,
    invoiceId: string,
    completedBy?: string,
    options?: CompleteSalesInvoiceDto,
  ) {
    const invoice = await this.ensureInvoiceExists(client, invoiceId, true);

    if (invoice.status === 'completed') {
      throw new BadRequestException('Sales invoice is already completed');
    }

    if (invoice.status === 'cancelled' || invoice.status === 'returned') {
      throw new BadRequestException(`Cannot complete invoice with status "${invoice.status}"`);
    }

    if (invoice.sale_type === 'cash') {
      // Cash: recalculateInvoiceTotals will auto-set paid_amount = total_amount
    } else if (options?.payments?.length) {
      await this.insertSalePayments(client, invoiceId, options.payments);
    } else if (options?.paid_amount !== undefined) {
      const paid = this.ensureNonNegative(options.paid_amount, 'paid_amount');
      await client.query(
        `UPDATE phar_sales_invoices SET paid_amount = $1 WHERE id = $2::uuid`,
        [paid, invoiceId],
      );
    }

    if (options?.notes !== undefined || options?.invoice_date !== undefined) {
      const set: string[] = [];
      const values: unknown[] = [];
      if (options.notes !== undefined) {
        values.push(options.notes ?? null);
        set.push(`notes = $${values.length}`);
      }
      if (options.invoice_date !== undefined) {
        values.push(options.invoice_date ?? null);
        set.push(`invoice_date = $${values.length}::timestamptz`);
      }

      if (set.length > 0) {
        values.push(invoiceId);
        await client.query(
          `
          UPDATE phar_sales_invoices
          SET ${set.join(', ')}
          WHERE id = $${values.length}::uuid
          `,
          values,
        );
      }
    }

    const itemsResult = await client.query<SalesInvoiceItemRow>(
      `
      SELECT *
      FROM phar_sales_invoice_items
      WHERE sales_invoice_id = $1::uuid
      ORDER BY created_at ASC
      FOR UPDATE
      `,
      [invoiceId],
    );

    const items = itemsResult.rows;
    if (!items.length) {
      throw new BadRequestException('Cannot complete sales invoice without items');
    }

    for (const item of items) {
      const stockSalesQty = item.stock_sales_qty > 0 ? item.stock_sales_qty : item.quantity;
      if (!Number.isFinite(stockSalesQty) || stockSalesQty <= 0) {
        throw new BadRequestException(
          `stock_sales_qty must be greater than zero for invoice item "${item.id}"`,
        );
      }

      const productResult = await client.query<{
        id: string;
        current_stock: number;
      }>(
        `
        SELECT id, current_stock
        FROM phar_products
        WHERE id = $1::uuid
        FOR UPDATE
        LIMIT 1
        `,
        [item.product_id],
      );

      const product = productResult.rows[0];
      if (!product) {
        throw new NotFoundException(`Product not found for id "${item.product_id}"`);
      }

      if ((product.current_stock ?? 0) < stockSalesQty) {
        throw new BadRequestException(
          `Insufficient stock for product "${item.product_id}". Required ${stockSalesQty}, available ${product.current_stock ?? 0}`,
        );
      }

      if (item.product_batch_id) {
        const batchResult = await client.query<{
          id: string;
          quantity_on_hand: number;
        }>(
          `
          SELECT id, quantity_on_hand
          FROM phar_product_batches
          WHERE id = $1::uuid
            AND product_id = $2::uuid
          FOR UPDATE
          LIMIT 1
          `,
          [item.product_batch_id, item.product_id],
        );

        const batch = batchResult.rows[0];
        if (!batch) {
          throw new NotFoundException(
            `Product batch "${item.product_batch_id}" not found for product "${item.product_id}"`,
          );
        }

        if ((batch.quantity_on_hand ?? 0) < stockSalesQty) {
          throw new BadRequestException(
            `Insufficient batch stock for batch "${item.product_batch_id}". Required ${stockSalesQty}, available ${batch.quantity_on_hand ?? 0}`,
          );
        }

        await client.query(
          `
          UPDATE phar_product_batches
          SET quantity_on_hand = quantity_on_hand - $1
          WHERE id = $2::uuid
          `,
          [stockSalesQty, item.product_batch_id],
        );
      }

      await client.query(
        `
        UPDATE phar_products
        SET current_stock = current_stock - $1
        WHERE id = $2::uuid
        `,
        [stockSalesQty, item.product_id],
      );

      await client.query(
        `
        UPDATE phar_sales_invoice_items
        SET
          stock_sales_qty = $1,
          quantity = $1
        WHERE id = $2::uuid
        `,
        [stockSalesQty, item.id],
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
          'sale',
          'sales_invoice',
          $5::uuid,
          $6,
          $7,
          $8,
          $9::uuid
        )
        `,
        [
          invoice.shop_id ?? null,
          invoice.branch_id ?? null,
          item.product_id,
          item.product_batch_id ?? null,
          invoiceId,
          -stockSalesQty,
          this.toNumber(item.unit_price),
          options?.notes ?? invoice.notes ?? null,
          completedBy ?? null,
        ],
      );
    }

    await client.query(
      `
      UPDATE phar_sales_invoices
      SET status = 'completed'
      WHERE id = $1::uuid
      `,
      [invoiceId],
    );

    await this.recalculateInvoiceTotals(client, invoiceId);
  }

  private async getInvoiceById(id: string) {
    const result = await this.databaseService.query(
      `
      SELECT
        si.*,
        c.name AS customer_name
      FROM phar_sales_invoices si
      LEFT JOIN phar_companies c ON c.id = si.customer_id
      WHERE si.id = $1::uuid
      LIMIT 1
      `,
      [id],
    );

    const invoice = result.rows[0];
    if (!invoice) {
      throw new NotFoundException(`Sales invoice not found for id "${id}"`);
    }
    return invoice;
  }

  private async getInvoiceItems(invoiceId: string) {
    const result = await this.databaseService.query(
      `
      SELECT
        sii.*,
        p.name AS product_name,
        p.unit_id AS stock_unit_id,
        p.default_unit_id,
        p.current_stock AS product_stock_available,
        su.name AS sales_unit_name,
        stu.name AS stock_unit_name,
        pb.batch_number,
        pb.quantity_on_hand AS batch_stock_available
      FROM phar_sales_invoice_items sii
      JOIN phar_products p ON p.id = sii.product_id
      LEFT JOIN phar_product_units su ON su.id = sii.sales_unit_id
      LEFT JOIN phar_product_units stu ON stu.id = p.unit_id
      LEFT JOIN phar_product_batches pb ON pb.id = sii.product_batch_id
      WHERE sii.sales_invoice_id = $1::uuid
      ORDER BY sii.created_at ASC
      `,
      [invoiceId],
    );

    return result.rows;
  }

  private async ensureInvoiceExists(client: PoolClient, id: string, forUpdate = false) {
    const result = await client.query<SalesInvoiceRow>(
      `
      SELECT *
      FROM phar_sales_invoices
      WHERE id = $1::uuid
      ${forUpdate ? 'FOR UPDATE' : ''}
      LIMIT 1
      `,
      [id],
    );

    const invoice = result.rows[0];
    if (!invoice) {
      throw new NotFoundException(`Sales invoice not found for id "${id}"`);
    }
    return invoice;
  }

  private async getInvoiceItemById(
    client: PoolClient,
    invoiceId: string,
    itemId: string,
    forUpdate = false,
  ) {
    const result = await client.query<SalesInvoiceItemRow>(
      `
      SELECT *
      FROM phar_sales_invoice_items
      WHERE id = $1::uuid
        AND sales_invoice_id = $2::uuid
      ${forUpdate ? 'FOR UPDATE' : ''}
      LIMIT 1
      `,
      [itemId, invoiceId],
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(
        `Sales invoice item not found for invoice "${invoiceId}" and item "${itemId}"`,
      );
    }
    return row;
  }

  private async getProductUnitContext(client: PoolClient, productId: string) {
    const productResult = await client.query<ProductUnitContextRow>(
      `
      SELECT id, unit_id, default_unit_id, current_stock
      FROM phar_products
      WHERE id = $1::uuid
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

  private async generatePaymentNumber(client: PoolClient) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const candidate = `PAY-${timestamp}-${random}`;
      const exists = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (SELECT 1 FROM phar_sale_payments WHERE payment_number = $1) AS exists`,
        [candidate],
      );
      if (!exists.rows[0]?.exists) return candidate;
    }
    throw new BadRequestException('Failed to generate unique payment number');
  }

  private async insertSalePayments(
    client: PoolClient,
    invoiceId: string,
    payments: SalePaymentDto[],
    receivedBy?: string,
  ) {
    for (const p of payments) {
      const amount = this.ensureNonNegative(p.amount, 'payment.amount');
      const paymentNumber = await this.generatePaymentNumber(client);
      await client.query(
        `
        INSERT INTO phar_sale_payments (
          invoice_id, payment_number, shop_id, branch_id,
          reference_type, reference_id, payment_method_id, amount,
          status, paid_at, received_by, notes
        ) VALUES (
          $1::uuid, $2,
          $3::uuid, $4::uuid,
          $5, $6::uuid, $7::uuid, $8,
          $9, $10::timestamptz, $11::uuid, $12
        )
        `,
        [
          invoiceId,
          paymentNumber,
          p.shop_id ?? null,
          p.branch_id ?? null,
          p.reference_type ?? null,
          p.reference_id ?? null,
          p.payment_method_id ?? null,
          amount,
          p.status ?? 'paid',
          p.paid_at ?? null,
          receivedBy ?? null,
          p.notes ?? null,
        ],
      );
    }

    await this.syncInvoicePaidAmount(client, invoiceId);
  }

  private async syncInvoicePaidAmount(client: PoolClient, invoiceId: string) {
    const result = await client.query<{ total_paid: string }>(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid FROM phar_sale_payments WHERE invoice_id = $1::uuid`,
      [invoiceId],
    );
    const totalPaid = this.roundMoney(this.toNumber(result.rows[0]?.total_paid));
    await client.query(
      `UPDATE phar_sales_invoices SET paid_amount = $1 WHERE id = $2::uuid`,
      [totalPaid, invoiceId],
    );
  }

  private async getInvoicePayments(invoiceId: string) {
    const result = await this.databaseService.query(
      `
      SELECT
        sp.id, sp.invoice_id, sp.payment_number, sp.shop_id, sp.branch_id,
        sp.reference_type, sp.reference_id, sp.payment_method_id,
        pm.name AS payment_method_name, pm.method_type AS payment_method_type,
        sp.amount, sp.status, sp.paid_at, sp.received_by, sp.notes, sp.created_at
      FROM phar_sale_payments sp
      LEFT JOIN phar_payment_methods pm ON pm.id = sp.payment_method_id
      WHERE sp.invoice_id = $1::uuid
      ORDER BY sp.created_at ASC
      `,
      [invoiceId],
    );

    return result.rows.map((row) => ({
      ...row,
      amount: this.toNumber(row.amount),
    }));
  }

  private ensureInvoiceMutableForItems(invoice: SalesInvoiceRow) {
    if (invoice.status === 'completed' || invoice.status === 'cancelled' || invoice.status === 'returned') {
      throw new BadRequestException(
        `Cannot modify invoice items when invoice status is "${invoice.status}"`,
      );
    }
  }

  private async generateInvoiceNumber(client: PoolClient) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      const candidate = `SI-${timestamp}-${random}`;

      const exists = await client.query<{ exists: boolean }>(
        `
        SELECT EXISTS (
          SELECT 1
          FROM phar_sales_invoices
          WHERE invoice_number = $1
        ) AS exists
        `,
        [candidate],
      );

      if (!exists.rows[0]?.exists) {
        return candidate;
      }
    }

    throw new BadRequestException('Failed to generate unique sales invoice number');
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

  private toStockQuantity(salesQty: number, convertRate: number) {
    const raw = salesQty * convertRate;
    const rounded = Math.round(raw);
    if (Math.abs(raw - rounded) > 0.000001) {
      throw new BadRequestException(
        'Converted stock quantity must be a whole number. Adjust sales_qty or convert_rate.',
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
}
