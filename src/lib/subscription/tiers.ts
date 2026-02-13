/**
 * Subscription tier definitions and pricing
 */

import { Database } from '@/types/database.types';

export type AppreciationTier = Database['public']['Enums']['appreciation_tier'];
export type BillingInterval = Database['public']['Enums']['billing_interval'];

export interface TierPrice {
  tier: AppreciationTier;
  monthly: number;
  yearly: number;
  label: string;
  emoji: string;
}

/**
 * Fixed-tier pricing structure (DEPRECATED - use pricingService or useDynamicPricing hook).
 * Dollar amounts here are seed values only. The source of truth is the tier_pricing DB table.
 * @deprecated Use pricingService (server) or useDynamicPricing hook (client) instead.
 */
export const TIER_PRICES: TierPrice[] = [
  {
    tier: 'supporter',
    monthly: 4,
    yearly: 40,
    label: 'Supporter',
    emoji: '🙌',
  },
  {
    tier: 'champion',
    monthly: 8,
    yearly: 80,
    label: 'Champion',
    emoji: '🏆',
  },
  {
    tier: 'legend',
    monthly: 23,
    yearly: 230,
    label: 'Legend',
    emoji: '🌟',
  },
  {
    tier: 'hall_of_famer',
    monthly: 48,
    yearly: 480,
    label: 'Hall of Famer',
    emoji: '👑',
  },
  {
    tier: 'appreciation',
    monthly: 0,
    yearly: 0,
    label: 'Appreciation',
    emoji: '🎁',
  },
];

/**
 * Get price for a tier and billing interval (DEPRECATED).
 * @deprecated Use pricingService.getPrice() or pricingService.getPriceCents() instead.
 */
export const getTierPrice = (tier: AppreciationTier, interval: BillingInterval): number => {
  const tierPrice = TIER_PRICES.find((t) => t.tier === tier);
  if (!tierPrice) return interval === 'yearly' ? 40 : 4;
  return interval === 'yearly' ? tierPrice.yearly : tierPrice.monthly;
};

/**
 * Get tier details by tier type
 */
export const getTierDetails = (tier: AppreciationTier): TierPrice | undefined => {
  return TIER_PRICES.find((t) => t.tier === tier);
};

/**
 * Get tier label for display
 */
export const getTierLabel = (tier: AppreciationTier): string => {
  const details = getTierDetails(tier);
  return details?.label ?? 'Supporter';
};

/**
 * Get tier emoji
 */
export const getTierEmoji = (tier: AppreciationTier): string => {
  const details = getTierDetails(tier);
  return details?.emoji ?? '🙌';
};

/**
 * Calculate monthly equivalent for yearly subscriptions (DEPRECATED).
 * @deprecated Use useDynamicPricing().getMonthlyEquivalent() instead.
 */
export const getMonthlyEquivalent = (tier: AppreciationTier): number => {
  const tierPrice = TIER_PRICES.find((t) => t.tier === tier);
  if (!tierPrice) return 4;
  return Math.round(tierPrice.yearly / 12);
};
