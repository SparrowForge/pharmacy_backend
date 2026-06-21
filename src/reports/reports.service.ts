import { BadRequestException, Injectable } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';
import { PaymentReportQueryDto } from './dto/payment-report-query.dto';
import { PurchaseReportQueryDto } from './dto/purchase-report-query.dto';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';
import { StatementQueryDto } from './dto/statement-query.dto';
import { StockReportQueryDto } from './dto/stock-report-query.dto';

type StockReportRow = QueryResultRow & {
  product_id: string;
  code: string | null;
  barcode: string | null;
  product_number: string | null;
  name: string;
  category_id: string | null;
  category_name: string | null;
  opening_stock: string;
  receive_qty: string;
  purchase_return_qty: string;
  sales_qty: string;
  sales_return_qty: string;
  closing_stock: string;
};

@Injectable()
export class ReportsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Stock movement report over a date range. Figures are derived from
   * phar_stock_movements (signed quantities):
   *   - opening_stock       : net of every movement before start_date
   *   - receive_qty         : purchase_receipt movements inside the range
   *   - purchase_return_qty : purchase_return movements inside the range
   *   - sales_qty           : sale movements inside the range
   *   - sales_return_qty    : sales_return movements inside the range (stock back in)
   *   - closing_stock       : net of every movement up to and including end_date
   * end_date is inclusive (the whole day is counted).
   */
  async stockReport(query: StockReportQueryDto) {
    if (query.start_date > query.end_date) {
      throw new BadRequestException('start_date must be on or before end_date');
    }

    const params: unknown[] = [query.start_date, query.end_date];
    const productFilters: string[] = ['p.is_delete = FALSE'];

    if (query.category_id) {
      params.push(query.category_id);
      productFilters.push(`p.category_id = $${params.length}::uuid`);
    }

    if (query.product_id) {
      params.push(query.product_id);
      productFilters.push(`p.id = $${params.length}::uuid`);
    }

    const whereClause = `WHERE ${productFilters.join(' AND ')}`;

    const result = await this.databaseService.query<StockReportRow>(
      `
      SELECT
        p.id AS product_id,
        p.sku AS code,
        p.barcode,
        p.product_number,
        p.name,
        p.category_id,
        cat.name AS category_name,
        COALESCE(opening.qty, 0)::int AS opening_stock,
        COALESCE(period.receive_qty, 0)::int AS receive_qty,
        COALESCE(period.purchase_return_qty, 0)::int AS purchase_return_qty,
        COALESCE(period.sales_qty, 0)::int AS sales_qty,
        COALESCE(period.sales_return_qty, 0)::int AS sales_return_qty,
        COALESCE(closing.qty, 0)::int AS closing_stock
      FROM phar_products p
      LEFT JOIN phar_product_categories cat ON cat.id = p.category_id
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(sm.quantity), 0) AS qty        
    FROM phar_stock_movements sm
        WHERE sm.product_id = p.id
          AND sm.created_at < $1::date
      ) opening ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COALESCE(SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'purchase_receipt'), 0) AS receive_qty,
          -COALESCE(SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'purchase_return'), 0) AS purchase_return_qty,
          -COALESCE(SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'sale'), 0) AS sales_qty,
          COALESCE(SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'sales_return'), 0) AS sales_return_qty
        FROM phar_stock_movements sm
        WHERE sm.product_id = p.id
          AND sm.created_at >= $1::date
          AND sm.created_at < ($2::date + INTERVAL '1 day')
      ) period ON TRUE
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(sm.quantity), 0) AS qty
    FROM phar_stock_movements sm
        WHERE sm.product_id = p.id
          AND sm.created_at < ($2::date + INTERVAL '1 day')
      ) closing ON TRUE
      ${whereClause}
      ORDER BY p.name ASC
      `,
      params,
    );

    const rows = result.rows.map((row) => ({
      product_id: row.product_id,
      code: row.code ?? row.product_number ?? null,
      barcode: row.barcode,
      name: row.name,
      category_id: row.category_id,
      category_name: row.category_name,
      opening_stock: this.toNumber(row.opening_stock),
      receive_qty: this.toNumber(row.receive_qty),
      purchase_return_qty: this.toNumber(row.purchase_return_qty),
      sales_qty: this.toNumber(row.sales_qty),
      sales_return_qty: this.toNumber(row.sales_return_qty),
      closing_stock: this.toNumber(row.closing_stock),
    }));

    const totals = rows.reduce(
      (acc, row) => {
        acc.opening_stock += row.opening_stock;
        acc.receive_qty += row.receive_qty;
        acc.purchase_return_qty += row.purchase_return_qty;
        acc.sales_qty += row.sales_qty;
        acc.sales_return_qty += row.sales_return_qty;
        acc.closing_stock += row.closing_stock;
        return acc;
      },
      {
        opening_stock: 0,
        receive_qty: 0,
        purchase_return_qty: 0,
        sales_qty: 0,
        sales_return_qty: 0,
        closing_stock: 0,
      },
    );

    return {
      report: 'stock',
      filters: {
        start_date: query.start_date,
        end_date: query.end_date,
        category_id: query.category_id ?? null,
        product_id: query.product_id ?? null,
      },
      total: rows.length,
      totals,
      data: rows,
    };
  }

  async purchaseReport(query: PurchaseReportQueryDto) {
    if (query.start_date > query.end_date) {
      throw new BadRequestException('start_date must be on or before end_date');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const params: unknown[] = [query.start_date, query.end_date];
    const filters: string[] = [
      `po.created_at >= $1::date`,
      `po.created_at < ($2::date + INTERVAL '1 day')`,
    ];

    if (query.supplier_id) {
      params.push(query.supplier_id);
      filters.push(`po.supplier_id = $${params.length}::uuid`);
    }
    if (query.category_id) {
      params.push(query.category_id);
      filters.push(`p.category_id = $${params.length}::uuid`);
    }
    if (query.product_id) {
      params.push(query.product_id);
      filters.push(`poi.product_id = $${params.length}::uuid`);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const countResult = await this.databaseService.query<{ total: number }>(
      `
      SELECT COUNT(*)::int AS total
      FROM phar_purchase_order_items poi
      JOIN phar_purchase_orders po ON po.id = poi.purchase_order_id
      JOIN phar_products p ON p.id = poi.product_id
      ${whereClause}
      `,
      params,
    );

    const dataResult = await this.databaseService.query<QueryResultRow>(
      `
      SELECT
        po.created_at AS date,
        po.po_number,
        c.name AS supplier_name,
        p.name AS product_name,
        cat.name AS category_name,
        poi.quantity_purchase AS purchase_qty,
        poi.unit_cost,
        poi.line_total AS purchase_amount
      FROM phar_purchase_order_items poi
      JOIN phar_purchase_orders po ON po.id = poi.purchase_order_id
      JOIN phar_companies c ON c.id = po.supplier_id
      JOIN phar_products p ON p.id = poi.product_id
      LEFT JOIN phar_product_categories cat ON cat.id = p.category_id
      ${whereClause}
      ORDER BY po.created_at DESC, po.po_number, poi.created_at
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, limit, offset],
    );

    const rows = dataResult.rows.map((row) => ({
      date: row.date,
      po_number: row.po_number,
      supplier_name: row.supplier_name,
      product_name: row.product_name,
      category_name: row.category_name ?? null,
      purchase_qty: this.toNumber(row.purchase_qty),
      unit_cost: this.toNumber(row.unit_cost),
      purchase_amount: this.toNumber(row.purchase_amount),
    }));

    const totals = rows.reduce(
      (acc, row) => {
        acc.total_qty += row.purchase_qty;
        acc.total_amount += row.purchase_amount;
        return acc;
      },
      { total_qty: 0, total_amount: 0 },
    );

    return {
      report: 'purchase',
      filters: {
        start_date: query.start_date,
        end_date: query.end_date,
        supplier_id: query.supplier_id ?? null,
        category_id: query.category_id ?? null,
        product_id: query.product_id ?? null,
      },
      page,
      limit,
      total: countResult.rows[0]?.total ?? 0,
      totals: {
        total_qty: this.roundMoney(totals.total_qty),
        total_amount: this.roundMoney(totals.total_amount),
      },
      data: rows,
    };
  }

  async salesReport(query: SalesReportQueryDto) {
    if (query.start_date > query.end_date) {
      throw new BadRequestException('start_date must be on or before end_date');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const params: unknown[] = [query.start_date, query.end_date];
    const filters: string[] = [
      `si.status = 'completed'`,
      `si.invoice_date >= $1::date`,
      `si.invoice_date < ($2::date + INTERVAL '1 day')`,
    ];

    if (query.customer_id) {
      params.push(query.customer_id);
      filters.push(`si.customer_id = $${params.length}::uuid`);
    }
    if (query.category_id) {
      params.push(query.category_id);
      filters.push(`p.category_id = $${params.length}::uuid`);
    }
    if (query.product_id) {
      params.push(query.product_id);
      filters.push(`sii.product_id = $${params.length}::uuid`);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const countResult = await this.databaseService.query<{ total: number }>(
      `
      SELECT COUNT(*)::int AS total
      FROM phar_sales_invoice_items sii
      JOIN phar_sales_invoices si ON si.id = sii.sales_invoice_id
      JOIN phar_products p ON p.id = sii.product_id
      ${whereClause}
      `,
      params,
    );

    const dataResult = await this.databaseService.query<QueryResultRow>(
      `
      SELECT
        si.invoice_date AS date,
        si.invoice_number,
        c.name AS customer_name,
        p.name AS product_name,
        cat.name AS category_name,
        sii.sales_qty,
        sii.unit_price,
        sii.line_total AS sales_amount
      FROM phar_sales_invoice_items sii
      JOIN phar_sales_invoices si ON si.id = sii.sales_invoice_id
      LEFT JOIN phar_companies c ON c.id = si.customer_id
      JOIN phar_products p ON p.id = sii.product_id
      LEFT JOIN phar_product_categories cat ON cat.id = p.category_id
      ${whereClause}
      ORDER BY si.invoice_date DESC, si.invoice_number, sii.created_at
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, limit, offset],
    );

    const rows = dataResult.rows.map((row) => ({
      date: row.date,
      invoice_number: row.invoice_number,
      customer_name: row.customer_name ?? null,
      product_name: row.product_name,
      category_name: row.category_name ?? null,
      sales_qty: this.toNumber(row.sales_qty),
      unit_price: this.toNumber(row.unit_price),
      sales_amount: this.toNumber(row.sales_amount),
    }));

    const totals = rows.reduce(
      (acc, row) => {
        acc.total_qty += row.sales_qty;
        acc.total_amount += row.sales_amount;
        return acc;
      },
      { total_qty: 0, total_amount: 0 },
    );

    return {
      report: 'sales',
      filters: {
        start_date: query.start_date,
        end_date: query.end_date,
        customer_id: query.customer_id ?? null,
        category_id: query.category_id ?? null,
        product_id: query.product_id ?? null,
      },
      page,
      limit,
      total: countResult.rows[0]?.total ?? 0,
      totals: {
        total_qty: this.roundMoney(totals.total_qty),
        total_amount: this.roundMoney(totals.total_amount),
      },
      data: rows,
    };
  }

  async supplierStatement(supplierId: string, query: StatementQueryDto) {
    const params: unknown[] = [supplierId];
    const dateFilters: string[] = [];

    if (query.start_date) {
      params.push(query.start_date);
      dateFilters.push(`date >= $${params.length}::date`);
    }
    if (query.end_date) {
      params.push(query.end_date);
      dateFilters.push(`date < ($${params.length}::date + INTERVAL '1 day')`);
    }

    const havingClause = dateFilters.length ? `WHERE ${dateFilters.join(' AND ')}` : '';

    const result = await this.databaseService.query<QueryResultRow>(
      `
      SELECT * FROM (
        SELECT
          po.created_at AS date,
          'purchase' AS type,
          po.po_number AS reference_number,
          po.total_amount::numeric AS debit,
          0::numeric AS credit
        FROM phar_purchase_orders po
        WHERE po.supplier_id = $1::uuid

        UNION ALL

        SELECT
          COALESCE(pp.paid_at, pp.created_at) AS date,
          'payment' AS type,
          pp.payment_number AS reference_number,
          0::numeric AS debit,
          pp.amount::numeric AS credit
        FROM phar_purchase_payments pp
        JOIN phar_purchase_orders po ON po.id = pp.purchase_order_id
        WHERE po.supplier_id = $1::uuid

        UNION ALL

        SELECT
          pr.created_at AS date,
          'return' AS type,
          pr.return_number AS reference_number,
          0::numeric AS debit,
          pr.total_amount::numeric AS credit
        FROM phar_purchase_returns pr
        WHERE pr.supplier_id = $1::uuid
          AND pr.status = 'completed'
      ) t
      ${havingClause}
      ORDER BY date ASC, type
      `,
      params,
    );

    let runningBalance = 0;
    const rows = result.rows.map((row) => {
      const debit = this.toNumber(row.debit);
      const credit = this.toNumber(row.credit);
      runningBalance = this.roundMoney(runningBalance + debit - credit);
      return {
        date: row.date,
        type: row.type,
        reference_number: row.reference_number,
        debit,
        credit,
        balance: runningBalance,
      };
    });

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    return {
      report: 'supplier_statement',
      supplier_id: supplierId,
      filters: { start_date: query.start_date ?? null, end_date: query.end_date ?? null },
      totals: {
        total_debit: this.roundMoney(totalDebit),
        total_credit: this.roundMoney(totalCredit),
        closing_balance: this.roundMoney(totalDebit - totalCredit),
      },
      data: rows,
    };
  }

  async customerStatement(customerId: string, query: StatementQueryDto) {
    const params: unknown[] = [customerId];
    const dateFilters: string[] = [];

    if (query.start_date) {
      params.push(query.start_date);
      dateFilters.push(`date >= $${params.length}::date`);
    }
    if (query.end_date) {
      params.push(query.end_date);
      dateFilters.push(`date < ($${params.length}::date + INTERVAL '1 day')`);
    }

    const havingClause = dateFilters.length ? `WHERE ${dateFilters.join(' AND ')}` : '';

    const result = await this.databaseService.query<QueryResultRow>(
      `
      SELECT * FROM (
        SELECT
          si.invoice_date AS date,
          'sale' AS type,
          si.invoice_number AS reference_number,
          si.total_amount::numeric AS debit,
          0::numeric AS credit
        FROM phar_sales_invoices si
        WHERE si.customer_id = $1::uuid
          AND si.status = 'completed'

        UNION ALL

        SELECT
          COALESCE(sp.paid_at, sp.created_at) AS date,
          'payment' AS type,
          sp.payment_number AS reference_number,
          0::numeric AS debit,
          sp.amount::numeric AS credit
        FROM phar_sale_payments sp
        JOIN phar_sales_invoices si ON si.id = sp.invoice_id
        WHERE si.customer_id = $1::uuid

        UNION ALL

        SELECT
          sr.return_date AS date,
          'return' AS type,
          sr.return_number AS reference_number,
          0::numeric AS debit,
          sr.total_amount::numeric AS credit
        FROM phar_sales_returns sr
        WHERE sr.customer_id = $1::uuid
          AND sr.status = 'completed'
          AND sr.is_delete = FALSE
      ) t
      ${havingClause}
      ORDER BY date ASC, type
      `,
      params,
    );

    let runningBalance = 0;
    const rows = result.rows.map((row) => {
      const debit = this.toNumber(row.debit);
      const credit = this.toNumber(row.credit);
      runningBalance = this.roundMoney(runningBalance + debit - credit);
      return {
        date: row.date,
        type: row.type,
        reference_number: row.reference_number,
        debit,
        credit,
        balance: runningBalance,
      };
    });

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    return {
      report: 'customer_statement',
      customer_id: customerId,
      filters: { start_date: query.start_date ?? null, end_date: query.end_date ?? null },
      totals: {
        total_debit: this.roundMoney(totalDebit),
        total_credit: this.roundMoney(totalCredit),
        closing_balance: this.roundMoney(totalDebit - totalCredit),
      },
      data: rows,
    };
  }

  async supplierPaymentReport(query: PaymentReportQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const params: unknown[] = [];
    const filters: string[] = [];

    if (query.start_date) {
      params.push(query.start_date);
      filters.push(`pp.created_at >= $${params.length}::date`);
    }
    if (query.end_date) {
      params.push(query.end_date);
      filters.push(`pp.created_at < ($${params.length}::date + INTERVAL '1 day')`);
    }
    if (query.company_id) {
      params.push(query.company_id);
      filters.push(`po.supplier_id = $${params.length}::uuid`);
    }
    if (query.payment_method_id) {
      params.push(query.payment_method_id);
      filters.push(`pp.payment_method_id = $${params.length}::uuid`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const countResult = await this.databaseService.query<{ total: number }>(
      `
      SELECT COUNT(*)::int AS total
      FROM phar_purchase_payments pp
      JOIN phar_purchase_orders po ON po.id = pp.purchase_order_id
      ${whereClause}
      `,
      params,
    );

    const dataResult = await this.databaseService.query<QueryResultRow>(
      `
      SELECT
        pp.created_at AS date,
        pp.payment_number,
        c.name AS supplier_name,
        po.po_number,
        pm.name AS payment_method_name,
        pp.amount,
        pp.status,
        pp.paid_at,
        pp.notes
      FROM phar_purchase_payments pp
      JOIN phar_purchase_orders po ON po.id = pp.purchase_order_id
      JOIN phar_companies c ON c.id = po.supplier_id
      LEFT JOIN phar_payment_methods pm ON pm.id = pp.payment_method_id
      ${whereClause}
      ORDER BY pp.created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, limit, offset],
    );

    const rows = dataResult.rows.map((row) => ({
      date: row.date,
      payment_number: row.payment_number,
      supplier_name: row.supplier_name,
      po_number: row.po_number,
      payment_method_name: row.payment_method_name ?? null,
      amount: this.toNumber(row.amount),
      status: row.status,
      paid_at: row.paid_at,
      notes: row.notes,
    }));

    const totalAmount = rows.reduce((s, r) => s + r.amount, 0);

    return {
      report: 'supplier_payment',
      page,
      limit,
      total: countResult.rows[0]?.total ?? 0,
      total_amount: this.roundMoney(totalAmount),
      data: rows,
    };
  }

  async customerPaymentReport(query: PaymentReportQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const params: unknown[] = [];
    const filters: string[] = [];

    if (query.start_date) {
      params.push(query.start_date);
      filters.push(`sp.created_at >= $${params.length}::date`);
    }
    if (query.end_date) {
      params.push(query.end_date);
      filters.push(`sp.created_at < ($${params.length}::date + INTERVAL '1 day')`);
    }
    if (query.company_id) {
      params.push(query.company_id);
      filters.push(`si.customer_id = $${params.length}::uuid`);
    }
    if (query.payment_method_id) {
      params.push(query.payment_method_id);
      filters.push(`sp.payment_method_id = $${params.length}::uuid`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const countResult = await this.databaseService.query<{ total: number }>(
      `
      SELECT COUNT(*)::int AS total
      FROM phar_sale_payments sp
      JOIN phar_sales_invoices si ON si.id = sp.invoice_id
      ${whereClause}
      `,
      params,
    );

    const dataResult = await this.databaseService.query<QueryResultRow>(
      `
      SELECT
        sp.created_at AS date,
        sp.payment_number,
        c.name AS customer_name,
        si.invoice_number,
        pm.name AS payment_method_name,
        sp.amount,
        sp.status,
        sp.paid_at,
        sp.notes
      FROM phar_sale_payments sp
      JOIN phar_sales_invoices si ON si.id = sp.invoice_id
      LEFT JOIN phar_companies c ON c.id = si.customer_id
      LEFT JOIN phar_payment_methods pm ON pm.id = sp.payment_method_id
      ${whereClause}
      ORDER BY sp.created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, limit, offset],
    );

    const rows = dataResult.rows.map((row) => ({
      date: row.date,
      payment_number: row.payment_number,
      customer_name: row.customer_name ?? null,
      invoice_number: row.invoice_number,
      payment_method_name: row.payment_method_name ?? null,
      amount: this.toNumber(row.amount),
      status: row.status,
      paid_at: row.paid_at,
      notes: row.notes,
    }));

    const totalAmount = rows.reduce((s, r) => s + r.amount, 0);

    return {
      report: 'customer_payment',
      page,
      limit,
      total: countResult.rows[0]?.total ?? 0,
      total_amount: this.roundMoney(totalAmount),
      data: rows,
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
