import { BadRequestException, Injectable } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';
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
        SELECT SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'purchase_receipt')
        -SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'purchase_return')
        -SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'sale')
        +SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'sales_return')  AS qty        
        FROM phar_stock_movements sm
        WHERE sm.product_id = p.id
          AND sm.created_at < $1::date
      ) opening ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'purchase_receipt') AS receive_qty,
          -SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'purchase_return') AS purchase_return_qty,
          -SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'sale') AS sales_qty,
          SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'sales_return') AS sales_return_qty
        FROM phar_stock_movements sm
        WHERE sm.product_id = p.id
          AND sm.created_at >= $1::date
          AND sm.created_at < ($2::date + INTERVAL '1 day')
      ) period ON TRUE
      LEFT JOIN LATERAL (
        SELECT SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'purchase_receipt')
        -SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'purchase_return')
        -SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'sale')
        +SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'sales_return') AS qty
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

  private toNumber(value: unknown) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }
}
