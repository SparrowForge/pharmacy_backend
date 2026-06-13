import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  async getSummary(expiryDays = 30) {
    const [salesRes, ordersRes, lowStockRes, expiringRes] = await Promise.all([
      this.db.query<{ total: string }>(
        `SELECT COALESCE(SUM(total_amount), 0) AS total
         FROM phar_sales_invoices
         WHERE DATE(invoice_date) = CURRENT_DATE
           AND status = 'completed'`,
        [],
      ),
      this.db.query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM phar_sales_invoices
         WHERE DATE(invoice_date) = CURRENT_DATE
           AND status != 'cancelled'`,
        [],
      ),
      this.db.query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM phar_products p
         LEFT JOIN LATERAL (
           SELECT COALESCE(SUM(sm.quantity), 0) AS stock
           FROM phar_stock_movements sm
           WHERE sm.product_id = p.id
         ) stock_calc ON TRUE
         WHERE p.is_delete = FALSE
           AND stock_calc.stock <= p.minimum_stock`,
        [],
      ),
      this.db.query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM phar_product_batches pb
         JOIN phar_products p ON p.id = pb.product_id
         WHERE pb.is_delete = FALSE
           AND pb.quantity_on_hand > 0
           AND pb.expiry_date IS NOT NULL
           AND pb.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + ($1::int * INTERVAL '7 day'))
           AND p.is_delete = FALSE`,
        [expiryDays],
      ),
    ]);

    return {
      today_sales: parseFloat(salesRes.rows[0].total),
      total_orders: parseInt(ordersRes.rows[0].count, 10),
      low_stock_items: parseInt(lowStockRes.rows[0].count, 10),
      expiring_soon: parseInt(expiringRes.rows[0].count, 10),
    };
  }

  async getTodaySalesDetails(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [dataRes, countRes] = await Promise.all([
      this.db.query(
        `SELECT
           si.id,
           si.invoice_number,
           si.status,
           si.sale_type,
           si.subtotal,
           si.discount_amount,
           si.tax_amount,
           si.total_amount,
           si.paid_amount,
           si.due_amount,
           si.invoice_date,
           si.created_at,
           c.name AS customer_name,
           c.code AS customer_code
         FROM phar_sales_invoices si
         LEFT JOIN phar_companies c ON c.id = si.customer_id
         WHERE DATE(si.invoice_date) = CURRENT_DATE
           AND si.status = 'completed'
         ORDER BY si.invoice_date DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      this.db.query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM phar_sales_invoices
         WHERE DATE(invoice_date) = CURRENT_DATE
           AND status = 'completed'`,
        [],
      ),
    ]);

    const total = parseInt(countRes.rows[0].count, 10);
    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      data: dataRes.rows,
    };
  }

  async getTotalOrdersDetails(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [dataRes, countRes] = await Promise.all([
      this.db.query(
        `SELECT
           si.id,
           si.invoice_number,
           si.status,
           si.sale_type,
           si.total_amount,
           si.paid_amount,
           si.due_amount,
           si.invoice_date,
           si.created_at,
           c.name AS customer_name,
           c.code AS customer_code
         FROM phar_sales_invoices si
         LEFT JOIN phar_companies c ON c.id = si.customer_id
         WHERE DATE(si.invoice_date) = CURRENT_DATE
           AND si.status != 'cancelled'
         ORDER BY si.invoice_date DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      this.db.query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM phar_sales_invoices
         WHERE DATE(invoice_date) = CURRENT_DATE
           AND status != 'cancelled'`,
        [],
      ),
    ]);

    const total = parseInt(countRes.rows[0].count, 10);
    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      data: dataRes.rows,
    };
  }

  async getLowStockDetails(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [dataRes, countRes] = await Promise.all([
      this.db.query(
        `SELECT
           p.id,
           p.sku,
           p.barcode,
           p.name,
           stock_calc.stock AS current_stock,
           p.minimum_stock,
           p.reorder_level,
           p.rack_no,
           cat.name AS category_name,
           brand.name AS brand_name
         FROM phar_products p
         LEFT JOIN LATERAL (
           SELECT COALESCE(SUM(sm.quantity), 0) AS stock
           FROM phar_stock_movements sm
           WHERE sm.product_id = p.id
         ) stock_calc ON TRUE
         LEFT JOIN phar_product_categories cat ON cat.id = p.category_id
         LEFT JOIN phar_product_brands brand ON brand.id = p.brand_id
         WHERE p.is_delete = FALSE
           AND stock_calc.stock <= p.minimum_stock
         ORDER BY stock_calc.stock ASC, p.name ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      this.db.query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM phar_products p
         LEFT JOIN LATERAL (
           SELECT COALESCE(SUM(sm.quantity), 0) AS stock
           FROM phar_stock_movements sm
           WHERE sm.product_id = p.id
         ) stock_calc ON TRUE
         WHERE p.is_delete = FALSE
           AND stock_calc.stock <= p.minimum_stock`,
        [],
      ),
    ]);

    const total = parseInt(countRes.rows[0].count, 10);
    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      data: dataRes.rows,
    };
  }

  async getExpiringSoonDetails(days = 30, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [dataRes, countRes] = await Promise.all([
      this.db.query(
        `SELECT
           pb.id,
           pb.batch_number,
           pb.barcode,
           pb.expiry_date,
           pb.quantity_on_hand,
           pb.purchase_price,
           pb.selling_price,
           pb.status,
           p.id AS product_id,
           p.name AS product_name,
           p.sku AS product_sku,
           cat.name AS category_name,
           (pb.expiry_date - CURRENT_DATE) AS days_until_expiry
         FROM phar_product_batches pb
         JOIN phar_products p ON p.id = pb.product_id
         LEFT JOIN phar_product_categories cat ON cat.id = p.category_id
         WHERE pb.is_delete = FALSE
           AND pb.quantity_on_hand > 0
           AND pb.expiry_date IS NOT NULL
           AND pb.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + ($1::int * INTERVAL '1 day'))
           AND p.is_delete = FALSE
         ORDER BY pb.expiry_date ASC
         LIMIT $2 OFFSET $3`,
        [days, limit, offset],
      ),
      this.db.query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM phar_product_batches pb
         JOIN phar_products p ON p.id = pb.product_id
         WHERE pb.is_delete = FALSE
           AND pb.quantity_on_hand > 0
           AND pb.expiry_date IS NOT NULL
           AND pb.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + ($1::int * INTERVAL '1 day'))
           AND p.is_delete = FALSE`,
        [days],
      ),
    ]);

    const total = parseInt(countRes.rows[0].count, 10);
    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      days,
      data: dataRes.rows,
    };
  }
}
