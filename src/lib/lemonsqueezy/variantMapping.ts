/**
 * Centralized variant ID ↔ tier/interval mapping for LemonSqueezy
 *
 * Single source of truth for mapping between LemonSqueezy variant IDs
 * and our internal tier/billing interval concepts. Previously duplicated
 * across 5+ files (webhook, checkout, update-subscription, admin routes).
 */

import { Database } from '@/types/database.types';

export type AppreciationTier = Database['public']['Enums']['appreciation_tier'];
export type BillingInterval = Database['public']['Enums']['billing_interval'];

interface TierInterval {
  tier: AppreciationTier;
  interval: BillingInterval;
}

interface VariantConfig {
  envVar: string;
  tier: AppreciationTier;
  interval: BillingInterval;
}

/**
 * All variant configurations for LemonSqueezy products
 */
const VARIANT_CONFIGS: VariantConfig[] = [
  { envVar: 'LEMONSQUEEZY_MONTHLY_SUPPORTER_VARIANT_ID', tier: 'supporter', interval: 'monthly' },
  { envVar: 'LEMONSQUEEZY_MONTHLY_CHAMPION_VARIANT_ID', tier: 'champion', interval: 'monthly' },
  { envVar: 'LEMONSQUEEZY_MONTHLY_LEGEND_VARIANT_ID', tier: 'legend', interval: 'monthly' },
  {
    envVar: 'LEMONSQUEEZY_MONTHLY_HALL_OF_FAMER_VARIANT_ID',
    tier: 'hall_of_famer',
    interval: 'monthly',
  },
  { envVar: 'LEMONSQUEEZY_YEARLY_SUPPORTER_VARIANT_ID', tier: 'supporter', interval: 'yearly' },
  { envVar: 'LEMONSQUEEZY_YEARLY_CHAMPION_VARIANT_ID', tier: 'champion', interval: 'yearly' },
  { envVar: 'LEMONSQUEEZY_YEARLY_LEGEND_VARIANT_ID', tier: 'legend', interval: 'yearly' },
  {
    envVar: 'LEMONSQUEEZY_YEARLY_HALL_OF_FAMER_VARIANT_ID',
    tier: 'hall_of_famer',
    interval: 'yearly',
  },
];

/**
 * Map a LemonSqueezy variant ID to the corresponding tier and billing interval.
 * Returns null if the variant ID is not recognized.
 */
export function mapVariantToTierAndInterval(variantId: string | null): TierInterval | null {
  if (!variantId) return null;

  for (const config of VARIANT_CONFIGS) {
    if (variantId === process.env[config.envVar]) {
      return { tier: config.tier, interval: config.interval };
    }
  }

  return null;
}

/**
 * Get the LemonSqueezy variant ID for a given tier and billing interval.
 * Returns undefined if the variant ID env var is not set.
 */
export function getVariantId(
  tier: AppreciationTier,
  interval: BillingInterval
): string | undefined {
  const config = VARIANT_CONFIGS.find((c) => c.tier === tier && c.interval === interval);
  if (!config) return undefined;
  return process.env[config.envVar];
}

/**
 * Get all variant configurations.
 * Useful for iterating over all tier/interval/variant combinations (e.g., for price sync).
 */
export function getAllVariantConfigs(): Array<{
  tier: AppreciationTier;
  interval: BillingInterval;
  variantId: string | undefined;
  envVar: string;
}> {
  return VARIANT_CONFIGS.map((config) => ({
    tier: config.tier,
    interval: config.interval,
    variantId: process.env[config.envVar],
    envVar: config.envVar,
  }));
}
