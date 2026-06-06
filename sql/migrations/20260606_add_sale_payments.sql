CREATE TABLE IF NOT EXISTS public.phar_sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_invoice_id UUID NOT NULL REFERENCES public.phar_sales_invoices(id) ON DELETE CASCADE,
  payment_method phar_payment_method_type NOT NULL DEFAULT 'cash',
  amount NUMERIC(16,2) NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phar_idx_sale_payments_invoice
  ON public.phar_sale_payments(sales_invoice_id);
