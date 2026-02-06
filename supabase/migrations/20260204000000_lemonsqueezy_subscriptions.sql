-- ============================================================================
-- LEMON SQUEEZY SUBSCRIPTIONS & PAYMENT HISTORY
-- Date: February 4, 2026
-- Description: Add subscription tracking and itemized payment history tables
-- ============================================================================

-- ==========================================================================
-- CUSTOM ENUM TYPES
-- ==========================================================================

CREATE TYPE subscription_status AS ENUM (
  'active',
  'cancelled',
  'past_due',
  'paused',
  'expired',
  'trialing',
  'unpaid'
);

CREATE TYPE billing_interval AS ENUM ('monthly', 'yearly');

CREATE TYPE appreciation_tier AS ENUM (
  'supporter',
  'champion',
  'legend',
  'hall_of_famer'
);

-- ==========================================================================
-- TABLE: subscriptions
-- ==========================================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Lemon Squeezy identifiers
  lemonsqueezy_subscription_id TEXT UNIQUE,
  lemonsqueezy_customer_id TEXT,
  lemonsqueezy_order_id TEXT,
  lemonsqueezy_order_item_id TEXT,
  lemonsqueezy_product_id TEXT,
  lemonsqueezy_variant_id TEXT,

  -- Subscription details
  status subscription_status NOT NULL DEFAULT 'active',
  status_formatted TEXT,
  billing_interval billing_interval NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  tier appreciation_tier NOT NULL,

  -- Supporter preferences (tied to subscription)
  show_created_by BOOLEAN NOT NULL DEFAULT true,
  show_on_supporters_page BOOLEAN NOT NULL DEFAULT true,
  supporter_display_name TEXT,

  -- Customer portal URLs (pre-signed, short-lived)
  update_payment_method_url TEXT,
  customer_portal_url TEXT,
  customer_portal_update_subscription_url TEXT,

  -- Payment metadata
  card_brand TEXT,
  card_last_four TEXT,
  payment_processor TEXT,
  test_mode BOOLEAN NOT NULL DEFAULT false,

  -- Dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_amount_minimum CHECK (
    (billing_interval = 'monthly' AND amount_cents >= 500) OR
    (billing_interval = 'yearly' AND amount_cents >= 5000)
  ),
  CONSTRAINT chk_subscriptions_timestamps CHECK (created_at <= updated_at)
);

-- ==========================================================================
-- TABLE: payment_history
-- ==========================================================================

CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Lemon Squeezy identifiers
  lemonsqueezy_subscription_id TEXT,
  lemonsqueezy_order_id TEXT UNIQUE NOT NULL,
  lemonsqueezy_order_number INTEGER,
  order_identifier TEXT,
  lemonsqueezy_customer_id TEXT,
  lemonsqueezy_product_id TEXT,
  lemonsqueezy_variant_id TEXT,
  lemonsqueezy_order_item_id TEXT,

  -- Order details
  status TEXT,
  status_formatted TEXT,
  currency TEXT,
  currency_rate NUMERIC(12, 4),
  subtotal_cents INTEGER,
  discount_total_cents INTEGER,
  tax_cents INTEGER,
  total_cents INTEGER,
  subtotal_usd_cents INTEGER,
  discount_total_usd_cents INTEGER,
  tax_usd_cents INTEGER,
  total_usd_cents INTEGER,
  tax_name TEXT,
  tax_rate TEXT,
  refunded BOOLEAN NOT NULL DEFAULT false,
  refunded_at TIMESTAMPTZ,

  -- Customer details (snapshot at payment time)
  user_name TEXT,
  user_email TEXT,

  -- Receipt
  receipt_url TEXT,

  -- First order item snapshot
  order_item_quantity INTEGER,
  order_item_price_cents INTEGER,
  order_item_product_name TEXT,
  order_item_variant_name TEXT,
  order_item_created_at TIMESTAMPTZ,
  order_item_updated_at TIMESTAMPTZ,
  order_item_deleted_at TIMESTAMPTZ,
  order_item_test_mode BOOLEAN,
  order_items JSONB,

  -- Flags
  test_mode BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_payment_history_timestamps CHECK (created_at <= updated_at)
);

-- ==========================================================================
-- INDEXES
-- ==========================================================================

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX idx_subscriptions_lemonsqueezy_id ON subscriptions(lemonsqueezy_subscription_id);
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_subscription_id ON payment_history(subscription_id);
CREATE INDEX idx_payment_history_lemonsqueezy_order_id ON payment_history(lemonsqueezy_order_id);

-- ==========================================================================
-- TRIGGERS & FUNCTIONS
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.calculate_appreciation_tier(
  amount_cents INTEGER,
  billing_freq billing_interval
)
RETURNS appreciation_tier
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_temp, public
AS $$
DECLARE
  monthly_amount INTEGER;
BEGIN
  monthly_amount := CASE
    WHEN billing_freq = 'yearly' THEN amount_cents / 12
    ELSE amount_cents
  END;

  RETURN CASE
    WHEN monthly_amount >= 5000 THEN 'hall_of_famer'
    WHEN monthly_amount >= 2500 THEN 'legend'
    WHEN monthly_amount >= 1000 THEN 'champion'
    ELSE 'supporter'
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_subscription_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_temp, public
AS $$
BEGIN
  NEW.tier := calculate_appreciation_tier(NEW.amount_cents, NEW.billing_interval);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_subscription_tier
  BEFORE INSERT OR UPDATE OF amount_cents, billing_interval ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_tier();

CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_temp, public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE OR REPLACE FUNCTION public.update_payment_history_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_temp, public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_history_updated_at
  BEFORE UPDATE ON payment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_history_updated_at();

COMMENT ON FUNCTION public.calculate_appreciation_tier IS 'Calculates supporter tier based on monthly equivalent amount.';
COMMENT ON FUNCTION public.update_subscription_tier IS 'Updates tier based on amount/billing interval changes.';
COMMENT ON FUNCTION public.update_subscriptions_updated_at IS 'Auto-updates subscriptions.updated_at timestamp.';
COMMENT ON FUNCTION public.update_payment_history_updated_at IS 'Auto-updates payment_history.updated_at timestamp.';

-- ==========================================================================
-- ROW LEVEL SECURITY
-- ==========================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own subscription preferences"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all subscriptions (via webhooks)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- System admins can view all subscriptions
CREATE POLICY "System admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (is_system_admin());

-- System admins can update subscriptions (for gifting)
CREATE POLICY "System admins can update subscriptions"
  ON subscriptions FOR ALL
  USING (is_system_admin());

-- Users can view their own payment history
CREATE POLICY "Users can view own payment history"
  ON payment_history FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage payment history (via webhooks)
CREATE POLICY "Service role can manage payment history"
  ON payment_history FOR ALL
  USING (auth.role() = 'service_role');

-- System admins can view all payment history
CREATE POLICY "System admins can view all payment history"
  ON payment_history FOR SELECT
  USING (is_system_admin());
