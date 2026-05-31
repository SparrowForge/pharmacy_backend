ALTER TABLE public.phar_product_units
ADD COLUMN IF NOT EXISTS is_deafult_unit BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.phar_product_units
ADD COLUMN IF NOT EXISTS convert_rate NUMERIC(18,8);
