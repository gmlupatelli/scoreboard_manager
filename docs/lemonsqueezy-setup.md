# Lemon Squeezy Setup Guide

This guide covers the required Lemon Squeezy configuration for Scoreboard Manager, including subscription products, webhooks, and environment variables.

## 1) Store setup

1. Create a Lemon Squeezy account and store.
2. Enable **Test Mode** for development.
3. Copy the Store ID (Settings → General).

## 2) Create subscription products

Create **8 subscription products** with fixed pricing (4 tiers × 2 billing intervals):

### Monthly Subscriptions

1. **Supporter (Monthly)** - $4/month
2. **Champion (Monthly)** - $8/month
3. **Legend (Monthly)** - $23/month
4. **Hall of Famer (Monthly)** - $48/month

### Yearly Subscriptions

5. **Supporter (Yearly)** - $40/year (2 months free)
6. **Champion (Yearly)** - $80/year (2 months free)
7. **Legend (Yearly)** - $230/year (2 months free)
8. **Hall of Famer (Yearly)** - $480/year (2 months free)

**For each product:**
- Product type: **Subscription**
- Set the fixed price for the tier/interval combination
- Record the **Variant ID** from the default variant

> **Note**: Lemon Squeezy does not support Pay What You Want (PWYW) for subscriptions, only for one-time products. This is why we use fixed-tier pricing.

## 3) Webhook configuration

Create a webhook endpoint in Lemon Squeezy:

- **URL**: `https://<your-domain>/api/webhooks/lemonsqueezy`
- **Signing secret**: Generate a random 6–40 character secret
- **Events**:
  - `subscription_created`
  - `subscription_updated`
  - `subscription_cancelled`
  - `subscription_resumed`
  - `subscription_expired`
  - `subscription_paused`
  - `subscription_unpaused`
  - `subscription_payment_success`
  - `subscription_payment_failed`
  - `order_created`
  - `order_refunded`

> Lemon Squeezy signs requests with `X-Signature` using an HMAC SHA-256 digest.

## 4) Environment variables

Add the following values to your `.env.local` file:

```bash
# Lemon Squeezy API Configuration
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_WEBHOOK_SECRET=...

# Monthly Tier Variant IDs
LEMONSQUEEZY_MONTHLY_SUPPORTER_VARIANT_ID=...  # $4/month
LEMONSQUEEZY_MONTHLY_CHAMPION_VARIANT_ID=...   # $8/month
LEMONSQUEEZY_MONTHLY_LEGEND_VARIANT_ID=...     # $23/month
LEMONSQUEEZY_MONTHLY_HALL_OF_FAMER_VARIANT_ID=...  # $48/month

# Yearly Tier Variant IDs
LEMONSQUEEZY_YEARLY_SUPPORTER_VARIANT_ID=...  # $40/year (2 months free)
LEMONSQUEEZY_YEARLY_CHAMPION_VARIANT_ID=...   # $80/year (2 months free)
LEMONSQUEEZY_YEARLY_LEGEND_VARIANT_ID=...     # $230/year (2 months free)
LEMONSQUEEZY_YEARLY_HALL_OF_FAMER_VARIANT_ID=...  # $480/year (2 months free)
```

## 5) Overlay checkout

The app uses Lemon.js for overlay checkout. The script is loaded in the subscription section, and `window.createLemonSqueezy()` is called after load. If the overlay is blocked, the checkout opens in a new tab using the checkout URL returned by the API.

## 6) Verify test flow

1. Start a checkout from the **Profile Settings → Subscription** section.
2. Select a tier (Supporter, Champion, Legend, or Hall of Famer).
3. Choose billing interval (Monthly or Yearly).
4. Complete a test subscription.
5. Confirm:
   - Webhook delivery in Lemon Squeezy dashboard
   - `subscriptions` row created or updated with correct tier
   - `payment_history` row created
   - Billing history appears in the profile page
   - Tier badge displays correctly

## 7) Production switch

When ready for production:

1. Switch Lemon Squeezy store to **Live Mode**.
2. Create 8 new **live products** with the same tier structure.
3. Replace all variant IDs with live values in production environment.
4. Update webhook URL if using a different production domain.
5. Re-test a live payment and webhook delivery.

## Tier Structure

| Tier           | Monthly Price | Yearly Price          | Emoji |
|----------------|---------------|-----------------------|-------|
| Supporter      | $4            | $40 (2 months free)   | 🙌    |
| Champion       | $8            | $80 (2 months free)   | 🏆    |
| Legend         | $23           | $230 (2 months free)  | 🌟    |
| Hall of Famer  | $48           | $480 (2 months free)  | 👑    |

All tiers unlock the same features. Higher tiers simply show appreciation and help sustain the project.
