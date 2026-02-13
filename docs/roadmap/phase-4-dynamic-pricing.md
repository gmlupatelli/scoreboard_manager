# Phase 4: Dynamic Pricing System

**Priority:** 🟢 Low  
**Status:** ✅ Complete  
**Estimated Effort:** Medium (1 week)  
**Completed:** 2026-02-13

## Overview

Replace hardcoded tier pricing with a dynamic system that syncs pricing from LemonSqueezy via webhooks and API. Allow admins to manually trigger price syncs and store prices in a database table with fallback to hardcoded defaults.

## Goals

- **Single Source of Truth**: LemonSqueezy is the source for pricing
- **Automatic Sync**: Webhook events auto-update prices when changed in LemonSqueezy
- **Manual Control**: Admin can trigger price sync on-demand
- **Fallback Safety**: Hardcoded prices serve as fallback if API fails
- **Transparency**: Price changes logged to admin audit log

## Background

Currently, tier pricing is hardcoded in `src/lib/subscription/tiers.ts`:
- Supporter: $4/mo, $40/yr
- Champion: $8/mo, $80/yr
- Legend: $23/mo, $230/yr
- Hall of Famer: $48/mo, $480/yr

These values are used across:
- Pricing page
- Checkout flow
- Admin displays
- Tier calculation

**Problem**: Changing prices requires code changes and deployment.

**Solution**: Store prices in database, sync from LemonSqueezy, read from DB with fallback.

## Implementation Tasks

### Issue 4.1: Create Tier Pricing Table

**Description**: Create database table to store tier pricing information.

**Migration File:** `supabase/migrations/YYYYMMDDHHMMSS_create_tier_pricing.sql`

**Schema:**
```sql
CREATE TABLE tier_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier appreciation_tier NOT NULL,
  billing_interval billing_interval NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  lemonsqueezy_variant_id TEXT NOT NULL,
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

-- RLS Policy: Public read access
CREATE POLICY "tier_pricing_public_read"
  ON tier_pricing FOR SELECT
  USING (true);

-- RLS Policy: Admin only write
CREATE POLICY "tier_pricing_admin_write"
  ON tier_pricing FOR ALL
  USING (is_system_admin());

-- Auto-update trigger
CREATE TRIGGER trg_tier_pricing_updated_at
  BEFORE UPDATE ON tier_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Table comment
COMMENT ON TABLE tier_pricing IS 'Tier pricing synced from LemonSqueezy. Used as source of truth for subscription prices.';

-- Seed initial data from current hardcoded values
INSERT INTO tier_pricing (tier, billing_interval, amount_cents, currency, lemonsqueezy_variant_id) VALUES
  ('supporter', 'monthly', 400, 'USD', COALESCE($LEMONSQUEEZY_MONTHLY_SUPPORTER_VARIANT_ID, '')),
  ('champion', 'monthly', 800, 'USD', COALESCE($LEMONSQUEEZY_MONTHLY_CHAMPION_VARIANT_ID, '')),
  ('legend', 'monthly', 2300, 'USD', COALESCE($LEMONSQUEEZY_MONTHLY_LEGEND_VARIANT_ID, '')),
  ('hall_of_famer', 'monthly', 4800, 'USD', COALESCE($LEMONSQUEEZY_MONTHLY_HALL_OF_FAMER_VARIANT_ID, '')),
  ('supporter', 'yearly', 4000, 'USD', COALESCE($LEMONSQUEEZY_YEARLY_SUPPORTER_VARIANT_ID, '')),
  ('champion', 'yearly', 8000, 'USD', COALESCE($LEMONSQUEEZY_YEARLY_CHAMPION_VARIANT_ID, '')),
  ('legend', 'yearly', 23000, 'USD', COALESCE($LEMONSQUEEZY_YEARLY_LEGEND_VARIANT_ID, '')),
  ('hall_of_famer', 'yearly', 48000, 'USD', COALESCE($LEMONSQUEEZY_YEARLY_HALL_OF_FAMER_VARIANT_ID, ''))
ON CONFLICT (tier, billing_interval) DO NOTHING;
```

**Acceptance Criteria:**
- [ ] Migration creates table with proper constraints
- [ ] Unique constraint on (tier, billing_interval)
- [ ] RLS policies allow public read, admin-only write
- [ ] Initial seed data matches current hardcoded prices
- [ ] Variant IDs populated from environment variables

---

### Issue 4.2: Pricing Service

**Description**: Create service to fetch and update tier pricing from database.

**File:** `src/services/pricingService.ts`

**Functions:**
```typescript
export const pricingService = {
  // Get price for a specific tier and interval
  async getPrice(tier: AppreciationTier, interval: BillingInterval): Promise<number | null>

  // Get all current prices
  async getAllPrices(): Promise<TierPrice[]>

  // Sync prices from LemonSqueezy API (admin only)
  async syncPricesFromLemonSqueezy(): Promise<{ success: boolean; error: string | null }>

  // Update single price (internal, called by webhook)
  async updatePrice(tier: AppreciationTier, interval: BillingInterval, amountCents: number): Promise<void>
}
```

**Acceptance Criteria:**
- [ ] `getPrice()` queries tier_pricing table with fallback to hardcoded const
- [ ] `getAllPrices()` returns all 8 tier/interval combinations
- [ ] `syncPricesFromLemonSqueezy()` fetches from LemonSqueezy API for all variants
- [ ] Returns `{data, error}` pattern like other services
- [ ] Caches prices in memory for 5 minutes to reduce DB queries
- [ ] Updates `last_synced_at` timestamp

**Technical Notes:**
- Use LemonSqueezy API: `GET https://api.lemonsqueezy.com/v1/variants/{variant_id}`
- Response includes: `data.attributes.price` (in cents)
- Fallback to TIER_PRICES constant from `tiers.ts` if DB query fails
- Log sync actions to admin_audit_log

**LemonSqueezy API Call:**
```typescript
const response = await fetch(
  `https://api.lemonsqueezy.com/v1/variants/${variantId}`,
  {
    headers: {
      'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      'Accept': 'application/vnd.api+json',
    },
  }
);

const data = await response.json();
const priceCents = data.data.attributes.price; // in cents
```

---

### Issue 4.3: Webhook Handler Updates

**Description**: Add webhook event handlers for price changes in LemonSqueezy.

**File:** `src/app/api/lemonsqueezy/webhook/route.ts`

**New Events:**
- `subscription_product_updated`
- `subscription_variant_updated`

**Acceptance Criteria:**
- [ ] Webhook handler recognizes new event types
- [ ] Extracts variant_id and new price from webhook payload
- [ ] Determines which tier/interval by matching variant_id
- [ ] Updates tier_pricing table via pricingService
- [ ] Logs update to admin_audit_log
- [ ] Silently fails if variant not recognized (other products may exist)

**Technical Notes:**
- Webhook payload includes: `data.attributes.variant_id` and `data.attributes.price`
- Map variant_id → (tier, interval) using env variables
- Log: "Pricing updated: {tier} {interval} → ${newPrice}"

**Mapping Logic:**
```typescript
const variantToTier: Record<string, { tier: AppreciationTier; interval: BillingInterval }> = {
  [process.env.LEMONSQUEEZY_MONTHLY_SUPPORTER_VARIANT_ID!]: { tier: 'supporter', interval: 'monthly' },
  [process.env.LEMONSQUEEZY_MONTHLY_CHAMPION_VARIANT_ID!]: { tier: 'champion', interval: 'monthly' },
  // ... all 8 variants
};

const tierInfo = variantToTier[variantId];
if (tierInfo) {
  await pricingService.updatePrice(tierInfo.tier, tierInfo.interval, newPriceCents);
}
```

---

### Issue 4.4: Manual Sync API Endpoint

**Description**: Create admin endpoint to manually trigger price sync from LemonSqueezy.

**File:** `src/app/api/admin/pricing/sync/route.ts`

**Endpoint:** `POST /api/admin/pricing/sync`

**Acceptance Criteria:**
- [ ] Requires system_admin authentication
- [ ] Triggers full price sync from LemonSqueezy for all variants
- [ ] Returns list of updated prices
- [ ] Returns 401 if not admin
- [ ] Returns error if LemonSqueezy API fails
- [ ] Logs sync action to admin_audit_log
- [ ] Rate limited (max once per minute per admin)

**Response:**
```typescript
{
  success: true;
  updatedPrices: Array<{
    tier: AppreciationTier;
    interval: BillingInterval;
    oldPrice: number;
    newPrice: number;
  }>;
  syncedAt: string; // ISO timestamp
}
```

**Technical Notes:**
- Use pricingService.syncPricesFromLemonSqueezy()
- Compare old vs new prices and only update if different
- Log to admin_audit_log: "action: sync_pricing, changes: [...]"

---

### Issue 4.5: Admin UI - Pricing Configuration Section

**Description**: Add pricing configuration section to subscription management page.

**Location:** `src/app/system-admin/subscriptions/components/PricingConfigSection.tsx`

**Placement:** Between subscription table and admin audit log section.

**Acceptance Criteria:**
- [ ] Always visible (not behind modal)
- [ ] Displays current prices in a compact table:
  - 4 rows (one per tier)
  - 2 columns (Monthly, Yearly)
  - Shows formatted prices (e.g., "$4/mo", "$40/yr")
- [ ] "Sync Prices Now" button
- [ ] Last sync timestamp display
- [ ] Loading state during sync
- [ ] Success/error messages
- [ ] Sync button disabled if already syncing

**UI Design:**
```
┌─ Pricing Configuration ─────────────────────────────┐
│ Current pricing synced from LemonSqueezy            │
│                                                      │
│ ┌────────────────┬──────────┬──────────┐            │
│ │ Tier           │ Monthly  │ Yearly   │            │
│ ├────────────────┼──────────┼──────────┤            │
│ │ 🙌 Supporter   │ $4/mo    │ $40/yr   │            │
│ │ 🏆 Champion    │ $8/mo    │ $80/yr   │            │
│ │ 🌟 Legend      │ $23/mo   │ $230/yr  │            │
│ │ 👑 Hall of     │ $48/mo   │ $480/yr  │            │
│ │    Famer       │          │          │            │
│ └────────────────┴──────────┴──────────┘            │
│                                                      │
│ Last synced: Jan 15, 2026 at 3:45 PM                │
│                                                      │
│ [Sync Prices Now]                                   │
└──────────────────────────────────────────────────────┘
```

**Technical Notes:**
- Fetch prices on component mount via pricing service
- Auto-refresh prices every 5 minutes
- Show diff if prices changed (highlight in yellow)
- Confirm dialog before manual sync

---

### Issue 4.6: Update Pricing Page

**Description**: Update public pricing page to fetch prices from database instead of hardcoded values.

**File:** `src/app/pricing/page.tsx`

**Acceptance Criteria:**
- [ ] Fetch prices server-side (no auth required)
- [ ] Display fetched prices in pricing table
- [ ] Fallback to hardcoded prices if fetch fails (silent fallback)
- [ ] Update tier cards with dynamic prices
- [ ] No visible change to users if prices unchanged

**Technical Notes:**
- Server component can directly query tier_pricing table
- Use RLS public read policy
- Cache response for 5 minutes (revalidate)

---

### Issue 4.7: Update Tier Price References

**Description**: Replace all hardcoded price references with database lookups.

**Files to Update:**
- `src/lib/subscription/tiers.ts` - Update getTierPrice() to query DB
- `src/app/api/lemonsqueezy/checkout/route.ts` - Use pricingService
- `src/app/api/lemonsqueezy/update-subscription/route.ts` - Use pricingService

**Acceptance Criteria:**
- [ ] All price displays fetch from tier_pricing table
- [ ] Hardcoded TIER_PRICES array remains as fallback
- [ ] No code directly references hardcoded prices except fallback logic
- [ ] Price calculations use DB values

**Technical Notes:**
- Keep TIER_PRICES constant but mark as "Fallback prices if DB unavailable"
- Update getTierPrice() function:
```typescript
export async function getTierPrice(
  tier: AppreciationTier,
  interval: BillingInterval
): Promise<number> {
  const dbPrice = await pricingService.getPrice(tier, interval);
  if (dbPrice !== null) {
    return dbPrice / 100; // Convert cents to dollars
  }
  
  // Fallback to hardcoded
  const fallback = TIER_PRICES.find(t => t.tier === tier);
  return interval === 'monthly' ? fallback!.monthly : fallback!.yearly;
}
```

---

## Database Schema

### New Table: tier_pricing

See Issue 4.1 for full schema.

**Key fields:**
- `tier` + `billing_interval` (unique constraint)
- `amount_cents` (INTEGER, pricing in cents)
- `lemonsqueezy_variant_id` (for webhook mapping)
- `last_synced_at` (timestamp of last sync)

## API Endpoints

### New Endpoints

1. **POST /api/admin/pricing/sync**
   - Auth: system_admin required
   - Triggers manual price sync from LemonSqueezy
   - Returns: Updated prices with diff

2. **Webhook Events** (existing endpoint, new handlers)
   - `subscription_product_updated`
   - `subscription_variant_updated`
   - Auto-updates tier_pricing table

## Testing Requirements

### Unit Tests
- [ ] pricingService functions (getPrice, getAllPrices, syncPrices)
- [ ] Fallback logic when DB unavailable
- [ ] Variant ID → tier mapping logic

### Integration Tests
- [ ] Pricing sync API endpoint
- [ ] Webhook handlers for price updates
- [ ] Database queries and caching

### E2E Tests
- [ ] Admin can manually sync prices
- [ ] Pricing page displays correct values
- [ ] Checkout uses correct prices
- [ ] Price updates logged to audit log

## Dependencies

None - uses existing infrastructure and LemonSqueezy API.

## Migration Plan

1. **Phase 1**: Create tier_pricing table with seed data
2. **Phase 2**: Deploy pricing service with DB reads + fallback
3. **Phase 3**: Add webhook handlers (silent, no breaking changes)
4. **Phase 4**: Add admin UI for manual sync
5. **Phase 5**: Monitor and validate pricing accuracy

**Rollback Plan:** If DB queries fail, hardcoded fallback ensures no disruption.

## Rollout Plan

1. Create table and seed with current prices ✓
2. Deploy pricing service ✓
3. Update webhook handler ✓
4. Add admin UI ✓
5. Test manually triggering sync ✓
6. Monitor for 1 week before considering complete

## Success Metrics

- Price syncs complete successfully (target: >99% success rate)
- Admin uses manual sync feature when changing prices in LemonSqueezy
- No pricing errors or discrepancies
- Page load times unchanged (caching effective)

## Open Questions

- [ ] Should we send notification to admins when prices change via webhook?
- [ ] Should we maintain price history (audit trail of all past prices)?
- [ ] Should non-admin users see "last updated" timestamp on pricing page?
- [ ] Should we add price comparison to show savings for yearly vs monthly?

## Related Issues

- Depends on: Phase 1b (LemonSqueezy Integration) - ✅ Complete
- Depends on: Phase 1d (Supporter Tiers) - ✅ Complete
- Related to: Phase 4 (Admin Enhancements) - Shares admin page
- Future: Could add price A/B testing or regional pricing

## Security Considerations

- Price updates logged to admin_audit_log for transparency
- Manual sync rate-limited to prevent abuse
- RLS ensures only admins can modify prices
- API key secured in environment variables

## Performance Considerations

- In-memory cache (5 min TTL) reduces DB load
- Pricing page statically generated when possible
- Webhook updates are async and non-blocking
- Database index on (tier, billing_interval) for fast lookups
