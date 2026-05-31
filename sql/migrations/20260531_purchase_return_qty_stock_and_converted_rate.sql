ALTER TABLE public.phar_purchase_return_items
ADD COLUMN IF NOT EXISTS return_unit_id UUID REFERENCES public.phar_product_units(id);

ALTER TABLE public.phar_purchase_return_items
ADD COLUMN IF NOT EXISTS return_qty NUMERIC(18,6) NOT NULL DEFAULT 0;

ALTER TABLE public.phar_purchase_return_items
ADD COLUMN IF NOT EXISTS qty_return_stock INT NOT NULL DEFAULT 0;

ALTER TABLE public.phar_purchase_return_items
ADD COLUMN IF NOT EXISTS converted_rate_used NUMERIC(18,8) NOT NULL DEFAULT 1;

UPDATE public.phar_purchase_return_items pri
SET
  return_unit_id = COALESCE(pri.return_unit_id, p.default_unit_id, p.unit_id),
  return_qty = CASE
    WHEN pri.return_qty = 0 THEN COALESCE(pri.quantity, 0)::NUMERIC(18,6)
    ELSE pri.return_qty
  END,
  qty_return_stock = CASE
    WHEN pri.qty_return_stock = 0 THEN COALESCE(pri.quantity, 0)
    ELSE pri.qty_return_stock
  END,
  quantity = CASE
    WHEN pri.quantity = 0 THEN COALESCE(NULLIF(pri.qty_return_stock, 0), 0)
    ELSE pri.quantity
  END
FROM public.phar_products p
WHERE p.id = pri.product_id;

UPDATE public.phar_purchase_return_items pri
SET converted_rate_used = COALESCE(
  NULLIF(pri.converted_rate_used, 0),
  CASE
    WHEN pri.return_unit_id = p.unit_id THEN 1
    ELSE COALESCE(
      (
        SELECT pu.convert_rate
        FROM public.phar_product_units pu
        WHERE pu.id = pri.return_unit_id
        LIMIT 1
      ),
      1
    )
  END
)
FROM public.phar_products p
WHERE p.id = pri.product_id;

UPDATE public.phar_purchase_return_items
SET quantity = COALESCE(NULLIF(qty_return_stock, 0), quantity);

UPDATE public.phar_purchase_return_items
SET qty_return_stock = COALESCE(NULLIF(qty_return_stock, 0), quantity, 0);

ALTER TABLE public.phar_purchase_return_items
DROP COLUMN IF EXISTS stock_return_qty;
