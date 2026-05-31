ALTER TABLE public.phar_sales_invoice_items
ADD COLUMN IF NOT EXISTS sales_unit_id UUID REFERENCES public.phar_product_units(id);

ALTER TABLE public.phar_sales_invoice_items
ADD COLUMN IF NOT EXISTS sales_qty NUMERIC(18,6) NOT NULL DEFAULT 0;

ALTER TABLE public.phar_sales_invoice_items
ADD COLUMN IF NOT EXISTS stock_sales_qty INT NOT NULL DEFAULT 0;

UPDATE public.phar_sales_invoice_items sii
SET
  sales_unit_id = COALESCE(sii.sales_unit_id, p.default_unit_id, p.unit_id),
  sales_qty = CASE
    WHEN sii.sales_qty = 0 THEN COALESCE(sii.quantity, 0)::NUMERIC(18,6)
    ELSE sii.sales_qty
  END,
  stock_sales_qty = CASE
    WHEN sii.stock_sales_qty = 0 THEN COALESCE(sii.quantity, 0)
    ELSE sii.stock_sales_qty
  END,
  quantity = CASE
    WHEN sii.quantity = 0 THEN COALESCE(sii.stock_sales_qty, 0)
    ELSE sii.quantity
  END
FROM public.phar_products p
WHERE p.id = sii.product_id;

UPDATE public.phar_sales_invoice_items
SET quantity = stock_sales_qty
WHERE stock_sales_qty > 0
  AND quantity <> stock_sales_qty;
