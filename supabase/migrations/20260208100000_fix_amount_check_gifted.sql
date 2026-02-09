-- Migration: Fix amount_cents check constraint for gifted subscriptions
-- The original chk_amount_minimum requires amount_cents >= 400 (monthly) or >= 4000 (yearly)
-- but gifted subscriptions have amount_cents = 0, causing silent insert/update failures.

-- Drop the old constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS chk_amount_minimum;

-- Re-create it to allow amount_cents = 0 for gifted subscriptions
ALTER TABLE subscriptions ADD CONSTRAINT chk_amount_minimum CHECK (
  is_gifted = true OR
  (billing_interval = 'monthly' AND amount_cents >= 400) OR
  (billing_interval = 'yearly' AND amount_cents >= 4000)
);
