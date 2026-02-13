-- Migration: Create tier_pricing table for dynamic pricing (Phase 4)
-- Purpose: Store subscription pricing synced from LemonSqueezy, replacing hardcoded values.
-- Prices are in cents. Public read access, admin-only write.

-- ============================================================================
-- 1. Create tier_pricing table
-- ============================================================================
CREATE TABLE tier_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier appreciation_tier NOT NULL,
  billing_interval billing_interval NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  lemonsqueezy_variant_id TEXT NOT NULL DEFAULT '',
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_tier_pricing_tier_interval UNIQUE (tier, billing_interval),
  CONSTRAINT chk_tier_pricing_timestamps CHECK (created_at <= updated_at)
);

-- Index for fast lookup
CREATE INDEX idx_tier_pricing_lookup ON tier_pricing(tier, billing_interval);

-- Enable RLS
ALTER TABLE tier_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access (pricing is not secret)
CREATE POLICY "tier_pricing_public_read"
  ON tier_pricing FOR SELECT
  USING (true);

-- RLS Policy: Admin only write
CREATE POLICY "tier_pricing_admin_write"
  ON tier_pricing FOR ALL
  USING (is_system_admin());

-- RLS Policy: Service role manages all (for webhook/sync updates)
CREATE POLICY "tier_pricing_service_manage"
  ON tier_pricing FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update trigger function
CREATE OR REPLACE FUNCTION update_tier_pricing_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_tier_pricing_updated_at IS 'Trigger function to auto-update updated_at timestamp. Uses fixed search_path for security.';

CREATE TRIGGER trg_tier_pricing_updated_at
  BEFORE UPDATE ON tier_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_tier_pricing_updated_at();

-- Table comment
COMMENT ON TABLE tier_pricing IS 'Tier pricing synced from LemonSqueezy. Used as source of truth for subscription prices with fallback to hardcoded defaults.';

-- ============================================================================
-- 2. Seed initial data from current hardcoded values
-- ============================================================================
-- Note: lemonsqueezy_variant_id is set to empty string by default.
-- Admin must trigger a sync or manually set variant IDs via the admin UI.
-- The application code maps variant IDs from environment variables at runtime.
INSERT INTO tier_pricing (tier, billing_interval, amount_cents, currency) VALUES
  ('supporter', 'monthly', 400, 'USD'),
  ('supporter', 'yearly', 4000, 'USD'),
  ('champion', 'monthly', 800, 'USD'),
  ('champion', 'yearly', 8000, 'USD'),
  ('legend', 'monthly', 2300, 'USD'),
  ('legend', 'yearly', 23000, 'USD'),
  ('hall_of_famer', 'monthly', 4800, 'USD'),
  ('hall_of_famer', 'yearly', 48000, 'USD'),
  ('appreciation', 'monthly', 0, 'USD'),
  ('appreciation', 'yearly', 0, 'USD')
ON CONFLICT (tier, billing_interval) DO NOTHING;
