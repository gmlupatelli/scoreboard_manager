'use client';

import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useAuthGuard } from '@/hooks';
import { getTierLabel, getTierEmoji } from '@/lib/subscription/tiers';

interface TierPrice {
  id: string;
  tier: string;
  billingInterval: string;
  amountCents: number;
  currency: string;
  lemonsqueezyVariantId: string;
  lastSyncedAt: string;
}

interface PriceDiff {
  tier: string;
  interval: string;
  oldAmountCents: number;
  newAmountCents: number;
  variantId: string;
}

interface SyncResult {
  synced: number;
  skipped: number;
  changes: PriceDiff[];
  errors?: string[];
}

interface PricingConfigSectionProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function PricingConfigSection({ isOpen, onToggle }: PricingConfigSectionProps) {
  const { getAuthHeaders } = useAuthGuard({ requiredRole: 'system_admin' });

  const [prices, setPrices] = useState<TierPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const loadPrices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/pricing', { headers });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error || 'Failed to fetch pricing');
        return;
      }
      const data = (await response.json()) as { prices: TierPrice[] };
      setPrices(data.prices);
    } catch (_err) {
      setError('Failed to load pricing data');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (isOpen) {
      loadPrices();
    }
  }, [isOpen, loadPrices]);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/pricing/sync', {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error || 'Sync failed');
        return;
      }

      const result = (await response.json()) as SyncResult;
      setSyncResult(result);

      // Reload prices after sync
      await loadPrices();
    } catch (_err) {
      setError('Failed to sync pricing');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group prices by tier for display
  const tiers = ['supporter', 'champion', 'legend', 'hall_of_famer'];
  const groupedPrices = tiers.map((tier) => ({
    tier,
    monthly: prices.find((p) => p.tier === tier && p.billingInterval === 'monthly'),
    yearly: prices.find((p) => p.tier === tier && p.billingInterval === 'yearly'),
  }));

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon name="CurrencyDollarIcon" size={20} className="text-text-secondary" />
          <span className="font-medium text-text-primary">Tier Pricing Configuration</span>
          {prices.length > 0 && (
            <span className="text-sm text-text-secondary">
              ({prices.filter((p) => p.tier !== 'appreciation').length} price entries)
            </span>
          )}
        </div>
        <Icon
          name={isOpen ? 'ChevronUpIcon' : 'ChevronDownIcon'}
          size={20}
          className="text-text-secondary"
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Sync Controls */}
          <div className="flex items-center justify-end">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-primary text-white rounded-md font-medium text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary transition-colors duration-150 flex items-center gap-2"
              title="Sync prices from LemonSqueezy API"
            >
              <Icon name="ArrowPathIcon" size={16} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync from LemonSqueezy'}
            </button>
          </div>

          {/* Sync Result */}
          {syncResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Icon
                  name="CheckCircleIcon"
                  size={18}
                  className="text-green-600 flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 text-sm text-green-800">
                  <p className="font-medium">
                    Sync complete: {syncResult.synced} synced, {syncResult.skipped} skipped
                    {syncResult.changes.length > 0 &&
                      `, ${syncResult.changes.length} price(s) changed`}
                  </p>
                  {syncResult.changes.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-green-700">
                      {syncResult.changes.map((diff, idx) => (
                        <li key={idx}>
                          {getTierEmoji(
                            diff.tier as 'supporter' | 'champion' | 'legend' | 'hall_of_famer'
                          )}{' '}
                          {getTierLabel(
                            diff.tier as 'supporter' | 'champion' | 'legend' | 'hall_of_famer'
                          )}{' '}
                          ({diff.interval}): {formatCurrency(diff.oldAmountCents)} →{' '}
                          {formatCurrency(diff.newAmountCents)}
                        </li>
                      ))}
                    </ul>
                  )}
                  {syncResult.errors && syncResult.errors.length > 0 && (
                    <div className="mt-2 text-red-700">
                      <p className="font-medium">Errors:</p>
                      <ul className="list-disc list-inside">
                        {syncResult.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSyncResult(null)}
                  className="text-green-600 hover:text-green-800 flex-shrink-0 transition-colors duration-150"
                  title="Dismiss sync result"
                >
                  <Icon name="XMarkIcon" size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <Icon name="ExclamationCircleIcon" size={18} className="text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              <span className="ml-2 text-text-secondary text-sm">Loading pricing...</span>
            </div>
          ) : (
            /* Pricing Table */
            <div className="overflow-x-auto border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Monthly
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Yearly
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Last Synced
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {groupedPrices.map(({ tier, monthly, yearly }) => (
                    <tr key={tier} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-text-primary">
                          {getTierEmoji(
                            tier as 'supporter' | 'champion' | 'legend' | 'hall_of_famer'
                          )}{' '}
                          {getTierLabel(
                            tier as 'supporter' | 'champion' | 'legend' | 'hall_of_famer'
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-text-primary font-mono">
                        {monthly ? formatCurrency(monthly.amountCents) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-text-primary font-mono">
                        {yearly ? formatCurrency(yearly.amountCents) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {monthly?.lastSyncedAt ? formatDate(monthly.lastSyncedAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* How-to info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Icon
                name="LightBulbIcon"
                size={20}
                className="text-amber-600 flex-shrink-0 mt-0.5"
              />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">How to update pricing</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Update the variant price in your LemonSqueezy dashboard</li>
                  <li>Click &quot;Sync from LemonSqueezy&quot; above to pull the new prices</li>
                  <li>The pricing page will automatically reflect the updated amounts</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
