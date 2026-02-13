-- Migration: Add subscription invoices table and payment failure tracking
-- Purpose: Track LemonSqueezy subscription payment events (success/failed/recovered/refunded)
-- and add payment failure metadata to the subscriptions table

-- ============================================================================
-- 1. Create billing_reason enum
-- ============================================================================
CREATE TYPE billing_reason AS ENUM ('initial', 'renewal', 'updated');

-- ============================================================================
-- 2. Create subscription_invoices table
-- ============================================================================
CREATE TABLE subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  lemonsqueezy_subscription_id TEXT,
  lemonsqueezy_invoice_id TEXT NOT NULL,
  lemonsqueezy_store_id TEXT,
  lemonsqueezy_customer_id TEXT,
  billing_reason billing_reason,
  invoice_status TEXT NOT NULL DEFAULT 'pending',
  card_brand TEXT,
  card_last_four TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  currency_rate NUMERIC(12, 8),
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  discount_total_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  subtotal_usd_cents INTEGER NOT NULL DEFAULT 0,
  discount_total_usd_cents INTEGER NOT NULL DEFAULT 0,
  tax_usd_cents INTEGER NOT NULL DEFAULT 0,
  total_usd_cents INTEGER NOT NULL DEFAULT 0,
  refunded_amount_cents INTEGER NOT NULL DEFAULT 0,
  refunded_amount_usd_cents INTEGER NOT NULL DEFAULT 0,
  invoice_url TEXT,
  test_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_subscription_invoices_ls_id UNIQUE (lemonsqueezy_invoice_id),
  CONSTRAINT chk_subscription_invoices_timestamps CHECK (created_at <= updated_at),
  CONSTRAINT chk_subscription_invoices_status CHECK (
    invoice_status IN ('pending', 'paid', 'void', 'refunded', 'partial_refund')
  )
);

-- Indexes
CREATE INDEX idx_subscription_invoices_user_created
  ON subscription_invoices(user_id, created_at DESC);
CREATE INDEX idx_subscription_invoices_subscription
  ON subscription_invoices(subscription_id);
CREATE INDEX idx_subscription_invoices_ls_sub_id
  ON subscription_invoices(lemonsqueezy_subscription_id);

-- Auto-update trigger function
CREATE OR REPLACE FUNCTION update_subscription_invoices_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_subscription_invoices_updated_at IS 'Trigger function to auto-update updated_at timestamp. Uses fixed search_path for security.';

CREATE TRIGGER trg_subscription_invoices_updated_at
  BEFORE UPDATE ON subscription_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_invoices_updated_at();

-- Enable RLS
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own invoices
CREATE POLICY "subscription_invoices_user_read"
  ON subscription_invoices FOR SELECT
  USING (auth.uid() = user_id);

-- System admins can read all invoices
CREATE POLICY "subscription_invoices_admin_read"
  ON subscription_invoices FOR SELECT
  USING (is_system_admin());

-- Service role manages all (webhooks)
CREATE POLICY "subscription_invoices_service_manage"
  ON subscription_invoices FOR ALL
  USING (auth.role() = 'service_role');

-- Table comment
COMMENT ON TABLE subscription_invoices IS 'Subscription payment invoices from LemonSqueezy webhooks. Tracks successful payments, failures, recoveries, and refunds.';

-- ============================================================================
-- 3. Add payment failure tracking columns to subscriptions
-- ============================================================================
ALTER TABLE subscriptions
  ADD COLUMN payment_failure_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN last_payment_failed_at TIMESTAMPTZ;

COMMENT ON COLUMN subscriptions.payment_failure_count IS 'Number of consecutive payment failures. Reset to 0 on successful payment.';
COMMENT ON COLUMN subscriptions.last_payment_failed_at IS 'Timestamp of the most recent payment failure. Null when no failures pending.';
