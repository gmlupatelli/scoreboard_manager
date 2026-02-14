'use client';

/**
 * Hook for loading dynamic tier pricing from the tier_pricing table.
 * No hardcoded fallback values — prices always come from the database.
 * While loading, price displays should show a loading state.
 */

import { useState, useEffect, useCallback } from 'react';
import { pricingService, TierPricingRow } from '@/services/pricingService';
import { type AppreciationTier, type BillingInterval } from '@/lib/subscription/tiers';

interface TierDisplayInfo {
  tier: AppreciationTier;
  label: string;
  emoji: string;
}

/** Tier metadata (labels, emojis) — does not include prices */
const TIER_DISPLAY: TierDisplayInfo[] = [
  { tier: 'supporter', label: 'Supporter', emoji: '🙌' },
  { tier: 'champion', label: 'Champion', emoji: '🏆' },
  { tier: 'legend', label: 'Legend', emoji: '🌟' },
  { tier: 'hall_of_famer', label: 'Hall of Famer', emoji: '👑' },
];

interface UseDynamicPricingReturn {
  /** Get the price in dollars for a tier + interval. Returns 0 if not loaded yet. */
  getPrice: (tier: AppreciationTier, interval: BillingInterval) => number;
  /** Get the monthly equivalent price for a yearly tier (yearly price / 12, rounded). Returns null if not loaded. */
  getMonthlyEquivalent: (tier: AppreciationTier) => number | null;
  /** Tier display metadata (labels, emojis) — no hardcoded prices */
  tierList: TierDisplayInfo[];
  /** All loaded pricing rows from the database. */
  prices: TierPricingRow[];
  /** Whether prices are currently being loaded. */
  isLoading: boolean;
  /** Any error encountered loading prices. */
  error: string | null;
}

export function useDynamicPricing(): UseDynamicPricingReturn {
  const [prices, setPrices] = useState<TierPricingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPrices = async () => {
      const { data, error: loadError } = await pricingService.getAllPrices();
      if (!isMounted) return;

      if (loadError || !data) {
        setError(loadError || 'Failed to load prices');
      } else {
        setPrices(data);
      }
      setIsLoading(false);
    };

    void loadPrices();

    return () => {
      isMounted = false;
    };
  }, []);

  const getPrice = useCallback(
    (tier: AppreciationTier, interval: BillingInterval): number => {
      const match = prices.find((p) => p.tier === tier && p.billingInterval === interval);
      if (!match) return 0;
      return match.amountCents / 100;
    },
    [prices]
  );

  const getMonthlyEquivalent = useCallback(
    (tier: AppreciationTier): number | null => {
      const match = prices.find((p) => p.tier === tier && p.billingInterval === 'yearly');
      if (!match) return null;
      return Math.round(match.amountCents / 100 / 12);
    },
    [prices]
  );

  return { getPrice, getMonthlyEquivalent, tierList: TIER_DISPLAY, prices, isLoading, error };
}
