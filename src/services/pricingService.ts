/**
 * Pricing Service
 *
 * Manages tier pricing data from the tier_pricing table.
 * Provides a 5-minute in-memory cache for server-side reads and
 * methods for admin syncing from LemonSqueezy.
 */

import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

type AppreciationTier = Database['public']['Enums']['appreciation_tier'];
type BillingInterval = Database['public']['Enums']['billing_interval'];
type TierPricingDbRow = Database['public']['Tables']['tier_pricing']['Row'];

export interface TierPricingRow {
  id: string;
  tier: AppreciationTier;
  billingInterval: BillingInterval;
  amountCents: number;
  currency: string;
  lemonsqueezyVariantId: string;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

// --- In-memory cache (5 minutes) ---
let priceCache: TierPricingRow[] | null = null;
let priceCacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

const isCacheValid = (): boolean => {
  return priceCache !== null && Date.now() - priceCacheTimestamp < CACHE_TTL_MS;
};

const invalidateCache = () => {
  priceCache = null;
  priceCacheTimestamp = 0;
};

const rowToTierPricing = (row: TierPricingDbRow): TierPricingRow => ({
  id: row.id,
  tier: row.tier,
  billingInterval: row.billing_interval,
  amountCents: row.amount_cents,
  currency: row.currency,
  lemonsqueezyVariantId: row.lemonsqueezy_variant_id,
  lastSyncedAt: row.last_synced_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const pricingService = {
  /**
   * Get all tier prices, using the in-memory cache when possible.
   */
  async getAllPrices(): Promise<{ data: TierPricingRow[] | null; error: string | null }> {
    if (isCacheValid() && priceCache) {
      return { data: priceCache, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('tier_pricing')
        .select('*')
        .order('tier')
        .order('billing_interval');

      if (error) {
        return { data: null, error: error.message };
      }

      const mapped = data.map(rowToTierPricing);
      priceCache = mapped;
      priceCacheTimestamp = Date.now();
      return { data: mapped, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to fetch pricing data.' };
    }
  },

  /**
   * Get the price (in dollars) for a specific tier and billing interval.
   */
  async getPrice(
    tier: AppreciationTier,
    interval: BillingInterval
  ): Promise<{ data: number | null; error: string | null }> {
    const { data: prices, error } = await this.getAllPrices();
    if (error || !prices) {
      return { data: null, error: error || 'No pricing data available.' };
    }

    const match = prices.find((p) => p.tier === tier && p.billingInterval === interval);
    if (!match) {
      return { data: null, error: `No pricing found for ${tier}/${interval}` };
    }

    return { data: match.amountCents / 100, error: null };
  },

  /**
   * Get the price in cents for a specific tier and billing interval.
   */
  async getPriceCents(
    tier: AppreciationTier,
    interval: BillingInterval
  ): Promise<{ data: number | null; error: string | null }> {
    const { data: prices, error } = await this.getAllPrices();
    if (error || !prices) {
      return { data: null, error: error || 'No pricing data available.' };
    }

    const match = prices.find((p) => p.tier === tier && p.billingInterval === interval);
    if (!match) {
      return { data: null, error: `No pricing found for ${tier}/${interval}` };
    }

    return { data: match.amountCents, error: null };
  },

  /**
   * Force invalidate the in-memory cache.
   */
  invalidateCache() {
    invalidateCache();
  },

  /**
   * Sync a tier price from a webhook event if the amount has changed.
   * Requires a service-role client because tier_pricing has admin-only write RLS.
   * Non-fatal — logs errors but never throws.
   */
  async syncPriceIfChanged(
    serviceClient: ReturnType<typeof import('@/lib/supabase/apiClient').getServiceRoleClient>,
    tier: AppreciationTier,
    interval: BillingInterval,
    amountCents: number,
    variantId: string | null
  ): Promise<void> {
    if (!serviceClient || amountCents <= 0) return;

    try {
      // Check current price in cache or DB
      const { data: currentCents } = await this.getPriceCents(tier, interval);

      if (currentCents === amountCents) return; // no change

      // Don't set updated_at — DB default handles INSERT, trigger handles UPDATE
      const { error } = await serviceClient.from('tier_pricing').upsert(
        {
          tier,
          billing_interval: interval,
          amount_cents: amountCents,
          lemonsqueezy_variant_id: variantId ?? '',
          last_synced_at: new Date().toISOString(),
        } as never,
        { onConflict: 'tier,billing_interval' }
      );

      if (error) {
        console.error('[PricingService] Failed to sync tier price:', error.message);
        return;
      }

      console.info(
        `[PricingService] Updated tier_pricing: ${tier}/${interval} from ${currentCents ?? 'null'} → ${amountCents} cents`
      );
      invalidateCache();
    } catch (_err) {
      console.error('[PricingService] Unexpected error syncing tier price');
    }
  },
};
