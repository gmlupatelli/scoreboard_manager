# Phase 1b: LemonSqueezy Integration & Subscriptions

**Priority:** 🔴 High  
**Dependencies:** Phase 1a (License & Public Pages)  
**Estimated Scope:** Large  
**Status:** ✅ **COMPLETED** (February 2026)

## Overview

Integrate LemonSqueezy as the payment provider with "Pay What You Want" pricing and recurring subscriptions.

For setup steps and environment variables, see [docs/lemonsqueezy-setup.md](docs/lemonsqueezy-setup.md).

---

## Implementation Summary

| Issue | Title | Status |
|-------|-------|--------|
| 1b.1 | LemonSqueezy Account Setup | ✅ Complete |
| 1b.2 | Database Schema for Subscriptions | ✅ Complete |
| 1b.3 | LemonSqueezy Webhook Handler | ✅ Complete |
| 1b.4 | Checkout Flow Implementation | ✅ Complete |
| 1b.5 | Subscription Management UI | ✅ Complete |
| 1b.6 | Subscription Helper Functions | ✅ Complete |

### Key Files Created/Modified

- `src/app/api/webhooks/lemonsqueezy/route.ts` - Webhook handler with signature verification
- `src/app/api/lemonsqueezy/checkout/route.ts` - Checkout URL generation
- `src/app/api/lemonsqueezy/portal/route.ts` - Customer portal access
- `src/app/api/lemonsqueezy/cancel-subscription/route.ts` - Subscription cancellation
- `src/app/api/lemonsqueezy/resume-subscription/route.ts` - Subscription resumption
- `src/app/api/lemonsqueezy/update-subscription/route.ts` - Tier change functionality
- `src/app/supporter-plan/` - Supporter Plan page with tier selection
- `src/app/user-profile-management/components/SubscriptionSection.tsx` - Subscription management UI
- `src/app/system-admin/subscriptions/` - Admin subscription management
- `src/services/subscriptionService.ts` - Subscription helper functions
- `src/lib/subscription/tiers.ts` - Tier definitions and pricing
- `src/lib/lemonsqueezy/webhookUtils.ts` - Webhook signature verification
- `supabase/migrations/20260204000000_lemonsqueezy_subscriptions.sql` - Database schema
- `supabase/migrations/20260207000000_admin_subscription_management.sql` - Admin features

---

## Issues

### Issue 1b.1: LemonSqueezy Account Setup

**Title:** Set up LemonSqueezy account and products

**Description:**
Create and configure LemonSqueezy account with:

1. Store setup
2. Products for Monthly and Yearly subscriptions
3. "Pay What You Want" pricing enabled
4. Webhook endpoints configured

**Acceptance Criteria:**

- [x] LemonSqueezy store created
- [x] Monthly subscription product created ($5 minimum, PWYW)
- [x] Yearly subscription product created ($50 minimum, PWYW)
- [x] Test mode configured for development
- [x] Webhook URL configured
- [x] API keys obtained and documented

**Technical Notes:**

- Store in development/test mode initially
- Document required environment variables:
  - `LEMONSQUEEZY_API_KEY`
  - `LEMONSQUEEZY_STORE_ID`
  - `LEMONSQUEEZY_WEBHOOK_SECRET`
  - `LEMONSQUEEZY_MONTHLY_VARIANT_ID`
  - `LEMONSQUEEZY_YEARLY_VARIANT_ID`

---

### Issue 1b.2: Database Schema for Subscriptions

**Title:** Create database schema for subscriptions

**Description:**
Design and implement database schema to track:

1. User subscription status
2. Payment history
3. Subscription tier/amount (stored for performance)
4. Billing cycle
5. Supporter preferences (display settings)

**Acceptance Criteria:**

- [x] Migration file created following baseline pattern
- [x] Schema supports subscription tracking
- [x] Tier name stored directly for faster queries
- [x] Supporter preferences included in subscription table
- [x] RLS policies configured
- [x] Indexes for performance

**Proposed Schema:**

```sql
-- Subscription status enum
CREATE TYPE subscription_status AS ENUM (
  'active',
  'cancelled',
  'past_due',
  'paused',
  'expired',
  'trialing',
  'unpaid'
);

-- Billing interval enum
CREATE TYPE billing_interval AS ENUM ('monthly', 'yearly');

-- Appreciation tier enum (stored for performance)
CREATE TYPE appreciation_tier AS ENUM (
  'supporter',
  'champion',
  'legend',
  'hall_of_famer'
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- LemonSqueezy identifiers
  lemonsqueezy_subscription_id TEXT UNIQUE,
  lemonsqueezy_customer_id TEXT,
  lemonsqueezy_order_id TEXT,
  lemonsqueezy_product_id TEXT,
  lemonsqueezy_variant_id TEXT,

  -- Subscription details
  status subscription_status NOT NULL DEFAULT 'active',
  billing_interval billing_interval NOT NULL,
  amount_cents INTEGER NOT NULL, -- Amount paid in cents
  currency TEXT NOT NULL DEFAULT 'USD',
  tier appreciation_tier NOT NULL, -- Stored for faster queries

  -- Supporter preferences (tied to subscription)
  show_created_by BOOLEAN NOT NULL DEFAULT true,
  show_on_supporters_page BOOLEAN NOT NULL DEFAULT true,
  supporter_display_name TEXT,

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

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX idx_subscriptions_lemonsqueezy_id ON subscriptions(lemonsqueezy_subscription_id);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
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

-- Trigger to update tier when amount changes
CREATE OR REPLACE FUNCTION calculate_appreciation_tier(amount_cents INTEGER, interval billing_interval)
RETURNS appreciation_tier AS $$
DECLARE
  monthly_amount INTEGER;
BEGIN
  -- Convert yearly to monthly equivalent
  monthly_amount := CASE
    WHEN interval = 'yearly' THEN amount_cents / 12
    ELSE amount_cents
  END;

  RETURN CASE
    WHEN monthly_amount >= 5000 THEN 'hall_of_famer'
    WHEN monthly_amount >= 2500 THEN 'legend'
    WHEN monthly_amount >= 1000 THEN 'champion'
    ELSE 'supporter'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-update tier on insert/update
CREATE OR REPLACE FUNCTION update_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tier := calculate_appreciation_tier(NEW.amount_cents, NEW.billing_interval);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_subscription_tier
  BEFORE INSERT OR UPDATE OF amount_cents, billing_interval ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_tier();

-- Payment history table (itemized order fields)
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- LemonSqueezy identifiers
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

  -- Customer details snapshot
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
```

**Technical Notes:**

- Tier is stored but auto-calculated via trigger for consistency
- Supporter preferences are on subscriptions table (tied to subscription lifecycle)
- System admins can view and modify subscriptions for user management
- Consider adding a `payment_history` table for audit trail

---

### Issue 1b.3: LemonSqueezy Webhook Handler

**Title:** Implement LemonSqueezy webhook handler

**Description:**
Create API endpoint to receive and process LemonSqueezy webhooks for:

1. Subscription created
2. Subscription updated
3. Subscription cancelled
4. Payment successful
5. Payment failed

**Acceptance Criteria:**

- [x] Webhook endpoint created at `/api/webhooks/lemonsqueezy`
- [x] Webhook signature verification implemented
- [x] All relevant events handled
- [x] Subscription status updated in database
- [x] Error handling and logging

**Technical Notes:**

```typescript
// Events to handle:
// - subscription_created
// - subscription_updated
// - subscription_cancelled
// - subscription_resumed
// - subscription_expired
// - subscription_paused
// - subscription_unpaused
// - subscription_payment_success
// - subscription_payment_failed
```

**Webhook Payload Example:**

```json
{
  "meta": {
    "event_name": "subscription_created",
    "custom_data": {
      "user_id": "uuid-here"
    }
  },
  "data": {
    "id": "sub_123",
    "attributes": {
      "status": "active",
      "first_subscription_item": {
        "price": 1000
      }
    }
  }
}
```

---

### Issue 1b.4: Checkout Flow Implementation

**Title:** Implement subscription checkout flow

**Description:**
Create the checkout flow that:

1. Shows "Pay What You Want" price selector
2. Redirects to LemonSqueezy checkout
3. Handles successful return
4. Updates user subscription status

**Acceptance Criteria:**

- [x] Price selector UI (slider or input with minimum)
- [x] Monthly/Yearly toggle
- [x] Shows calculated savings for yearly
- [x] Generates LemonSqueezy checkout URL with custom amount
- [x] Passes user_id in custom data for webhook matching
- [x] Success/cancel redirect pages

**Technical Notes:**

- Use LemonSqueezy Checkout Overlay or redirect
- Pass `checkout[custom][user_id]` for webhook matching
- Show appreciation tier they'll receive based on amount

---

### Issue 1b.5: Subscription Management UI

**Title:** Create subscription management page

**Description:**
Create a page where users can:

1. View current subscription status
2. See billing history
3. Update payment method (via LemonSqueezy portal)
4. Cancel subscription
5. Change subscription amount

**Acceptance Criteria:**

- [x] Route `/supporter-plan` and `/user-profile-management` (SubscriptionSection)
- [x] Current plan display
- [x] Current amount and tier badge
- [x] Next billing date
- [x] Link to update payment method
- [x] Cancel subscription button with confirmation
- [x] Change tier option (upgrade/downgrade appreciation tier)

**Technical Notes:**

- Use LemonSqueezy Customer Portal for payment method updates
- Changing amount may require canceling and resubscribing
- Show clear messaging about what happens on cancellation

---

### Issue 1b.6: Add Subscription Helper Functions

**Title:** Create subscription service and helper functions

**Description:**
Create reusable functions for subscription-related operations:

1. Check if user has active subscription
2. Get user's subscription tier (from stored value)
3. Get subscription details
4. Check feature access

**Acceptance Criteria:**

- [x] `subscriptionService` created in `src/services/subscriptionService.ts`
- [x] `hasActiveSubscription(userId)` function
- [x] `getSubscriptionTier(userId)` function (reads stored tier)
- [x] `getSubscription(userId)` function
- [x] `canAccessFeature(userId, feature)` function
- [x] `isSupporter(userId)` helper for quick checks

**Example Usage:**

```typescript
// Check if user is a Supporter (any paying tier)
const isSupporter = await subscriptionService.isSupporter(userId);

// Get tier for badge display (reads stored value)
const tier = await subscriptionService.getSubscriptionTier(userId);
// Returns: 'supporter' | 'champion' | 'legend' | 'hall_of_famer' | null

// Check specific feature
const canUseKiosk = await subscriptionService.canAccessFeature(userId, 'kiosk_mode');

// Get full subscription details
const subscription = await subscriptionService.getSubscription(userId);
```

**Technical Notes:**

- Tier is stored in database, no need to compute on read
- All Supporter tiers have same feature access
- Feature gating is binary: Free vs Supporter (any tier)
