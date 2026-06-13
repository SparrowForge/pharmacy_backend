-- Fix sales return tables: base schema had different column names.
-- The 20260611 migration used CREATE TABLE IF NOT EXISTS so it silently
-- did nothing since both tables already existed. Drop and recreate with
-- the schema the service layer expects.
-- Safe to run: these tables have no production data yet.

DROP TABLE IF EXISTS phar_sales_return_items;
DROP TABLE IF EXISTS phar_sales_returns;

CREATE TABLE phar_sales_returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_number VARCHAR(80) NOT NULL UNIQUE,
  sales_invoice_id UUID NOT NULL REFERENCES phar_sales_invoices(id),
  customer_id UUID REFERENCES phar_companies(id),
  shop_id UUID,
  branch_id UUID,
  status VARCHAR(30) NOT NULL DEFAULT 'completed',
  total_amount NUMERIC(16, 2) NOT NULL DEFAULT 0,
  reason TEXT,
  notes TEXT,
  created_by UUID,
  processed_by UUID,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  return_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_sales_return_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_return_id UUID NOT NULL REFERENCES phar_sales_returns(id) ON DELETE CASCADE,
  sales_invoice_item_id UUID NOT NULL REFERENCES phar_sales_invoice_items(id),
  product_id UUID NOT NULL REFERENCES phar_products(id),
  product_batch_id UUID REFERENCES phar_product_batches(id),
  return_unit_id UUID REFERENCES phar_product_units(id),
  return_qty NUMERIC(16, 6) NOT NULL,
  qty_return_stock NUMERIC(16, 6) NOT NULL,
  converted_rate_used NUMERIC(16, 6) NOT NULL DEFAULT 1,
  unit_price NUMERIC(16, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(16, 2) NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON phar_sales_return_items(sales_return_id);
