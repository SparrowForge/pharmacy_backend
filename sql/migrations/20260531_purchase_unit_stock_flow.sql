ALTER TABLE public.phar_products
ADD COLUMN IF NOT EXISTS default_unit_id UUID REFERENCES public.phar_product_units(id);

ALTER TABLE public.phar_purchase_order_items
ADD COLUMN IF NOT EXISTS purchase_unit_id UUID REFERENCES public.phar_product_units(id);

ALTER TABLE public.phar_purchase_order_items
ADD COLUMN IF NOT EXISTS quantity_purchase NUMERIC(18,6) NOT NULL DEFAULT 0;

ALTER TABLE public.phar_purchase_order_items
ADD COLUMN IF NOT EXISTS quantity_stock INT NOT NULL DEFAULT 0;

ALTER TABLE public.phar_purchase_order_items
ADD COLUMN IF NOT EXISTS quantity_received_purchase NUMERIC(18,6) NOT NULL DEFAULT 0;

ALTER TABLE public.phar_purchase_order_items
ADD COLUMN IF NOT EXISTS quantity_received_stock INT NOT NULL DEFAULT 0;

ALTER TABLE public.phar_purchase_order_items
ADD COLUMN IF NOT EXISTS convert_rate_used NUMERIC(18,8) NOT NULL DEFAULT 1;

ALTER TABLE public.phar_purchase_receipt_items
ADD COLUMN IF NOT EXISTS purchase_unit_id UUID REFERENCES public.phar_product_units(id);

ALTER TABLE public.phar_purchase_receipt_items
ADD COLUMN IF NOT EXISTS quantity_received_purchase NUMERIC(18,6) NOT NULL DEFAULT 0;

ALTER TABLE public.phar_purchase_receipt_items
ADD COLUMN IF NOT EXISTS quantity_received_stock INT NOT NULL DEFAULT 0;

ALTER TABLE public.phar_purchase_receipt_items
ADD COLUMN IF NOT EXISTS convert_rate_used NUMERIC(18,8) NOT NULL DEFAULT 1;

UPDATE public.phar_products
SET default_unit_id = unit_id
WHERE default_unit_id IS NULL
  AND unit_id IS NOT NULL;

UPDATE public.phar_purchase_order_items poi
SET
  purchase_unit_id = COALESCE(poi.purchase_unit_id, p.default_unit_id, p.unit_id),
  quantity_purchase = CASE
    WHEN poi.quantity_purchase = 0 THEN COALESCE(poi.quantity, 0)::NUMERIC(18,6)
    ELSE poi.quantity_purchase
  END,
  quantity_stock = CASE
    WHEN poi.quantity_stock = 0 THEN COALESCE(poi.quantity, 0)
    ELSE poi.quantity_stock
  END,
  quantity_received_purchase = CASE
    WHEN poi.quantity_received_purchase = 0 THEN COALESCE(poi.quantity_received, 0)::NUMERIC(18,6)
    ELSE poi.quantity_received_purchase
  END,
  quantity_received_stock = CASE
    WHEN poi.quantity_received_stock = 0 THEN COALESCE(poi.quantity_received, 0)
    ELSE poi.quantity_received_stock
  END
FROM public.phar_products p
WHERE p.id = poi.product_id;

UPDATE public.phar_purchase_order_items poi
SET convert_rate_used = COALESCE(
  NULLIF(poi.convert_rate_used, 0),
  CASE
    WHEN poi.purchase_unit_id = p.unit_id THEN 1
    ELSE COALESCE(
      (
        SELECT pu.convert_rate
        FROM public.phar_product_units pu
        WHERE pu.id = poi.purchase_unit_id
        LIMIT 1
      ),
      1
    )
  END
)
FROM public.phar_products p
WHERE p.id = poi.product_id;

UPDATE public.phar_purchase_receipt_items pri
SET
  purchase_unit_id = COALESCE(
    pri.purchase_unit_id,
    (
      SELECT poi.purchase_unit_id
      FROM public.phar_purchase_order_items poi
      WHERE poi.id = pri.purchase_order_item_id
      LIMIT 1
    ),
    p.default_unit_id,
    p.unit_id
  ),
  quantity_received_purchase = CASE
    WHEN pri.quantity_received_purchase = 0 THEN COALESCE(pri.quantity_received, 0)::NUMERIC(18,6)
    ELSE pri.quantity_received_purchase
  END,
  quantity_received_stock = CASE
    WHEN pri.quantity_received_stock = 0 THEN COALESCE(pri.quantity_received, 0)
    ELSE pri.quantity_received_stock
  END,
  convert_rate_used = COALESCE(
    NULLIF(pri.convert_rate_used, 0),
    COALESCE(
      NULLIF(
        (
          SELECT poi.convert_rate_used
          FROM public.phar_purchase_order_items poi
          WHERE poi.id = pri.purchase_order_item_id
          LIMIT 1
        ),
        0
      ),
      1
    )
  )
FROM public.phar_products p
WHERE p.id = pri.product_id;
