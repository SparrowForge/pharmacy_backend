-- Add paid_amount and due_amount tracking to purchase orders
ALTER TABLE public.phar_purchase_orders
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_amount  NUMERIC(16,2) NOT NULL DEFAULT 0;

-- Seed due_amount from existing total_amount (nothing paid yet)
UPDATE public.phar_purchase_orders
SET due_amount = total_amount
WHERE total_amount > 0 AND due_amount = 0;

-- Supplier payment table (mirrors phar_sale_payments)
CREATE TABLE IF NOT EXISTS public.phar_purchase_payments (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID        NOT NULL REFERENCES public.phar_purchase_orders(id) ON DELETE CASCADE,
  payment_number    VARCHAR(80) NOT NULL UNIQUE,
  shop_id           UUID,
  branch_id         UUID,
  reference_type    TEXT,
  reference_id      UUID,
  payment_method_id UUID        REFERENCES public.phar_payment_methods(id),
  amount            NUMERIC(16,2) NOT NULL,
  status            VARCHAR(30) NOT NULL DEFAULT 'paid',
  paid_at           TIMESTAMPTZ,
  paid_by           UUID,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phar_idx_purchase_payments_order
  ON public.phar_purchase_payments(purchase_order_id);

CREATE INDEX IF NOT EXISTS phar_idx_purchase_payments_created_at
  ON public.phar_purchase_payments(created_at);


