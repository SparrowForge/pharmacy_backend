DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'phar_sale_type') THEN
    CREATE TYPE public.phar_sale_type AS ENUM ('cash', 'credit');
  END IF;
END $$;

ALTER TABLE public.phar_sales_invoices
  ADD COLUMN IF NOT EXISTS sale_type public.phar_sale_type NOT NULL DEFAULT 'cash';
