-- Add soft-delete support to purchase returns.
ALTER TABLE public.phar_purchase_returns
ADD COLUMN IF NOT EXISTS is_delete BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS phar_idx_purchase_returns_is_delete
ON public.phar_purchase_returns(is_delete);
