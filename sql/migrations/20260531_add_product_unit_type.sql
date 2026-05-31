DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'phar_product_unit_type'
  ) THEN
    CREATE TYPE public.phar_product_unit_type AS ENUM (
      'Weight',
      'Height',
      'Volume',
      'Area',
      'Pieaces'
    );
  END IF;
END
$$;

ALTER TABLE public.phar_product_units
ADD COLUMN IF NOT EXISTS unit_type public.phar_product_unit_type NOT NULL DEFAULT 'Pieaces';
