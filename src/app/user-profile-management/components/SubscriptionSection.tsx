'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useSearchParams, useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useDynamicPricing } from '@/hooks';
import { subscriptionService } from '@/services/subscriptionService';
import { PaymentHistoryEntry, Subscription } from '@/types/models';
import { getSubscriptionStatusBadge } from '@/utils/subscriptionUtils';
import {
  getTierLabel,
  getTierEmoji,
  type AppreciationTier,
  type BillingInterval,
} from '@/lib/subscription/tiers';

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
      };
      Setup: (config: { eventHandler: (event: { event: string }) => void }) => void;
    };
  }
}

const formatCurrency = (cents: number): string => {
  return `$${cents / 100}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function SubscriptionSection() {
  const { user, refreshSubscription: _refreshSubscription } = useAuth();
  const { getPrice: getDynamicPrice, getMonthlyEquivalent, tierList } = useDynamicPricing();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [selectedTier, setSelectedTier] = useState<AppreciationTier>('supporter');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const successState = searchParams.get('subscription');

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      const [subscriptionResult, paymentResult] = await Promise.all([
        subscriptionService.getSubscription(user.id),
        subscriptionService.getPaymentHistory(user.id, 8),
      ]);

      if (subscriptionResult.error) {
        setError(subscriptionResult.error);
      } else {
        setSubscription(subscriptionResult.data);
      }

      if (paymentResult.error) {
        setError(paymentResult.error);
      } else if (paymentResult.data) {
        setPaymentHistory(paymentResult.data);
      }

      setIsLoading(false);
    };

    void loadSubscription();
  }, [user?.id]);

  // Redirect to dashboard on successful checkout
  useEffect(() => {
    if (successState === 'success') {
      router.replace('/dashboard?subscription=success');
    }
  }, [successState, router]);

  useEffect(() => {
    if (!checkoutUrl) return;

    if (window.createLemonSqueezy) {
      window.createLemonSqueezy();
    }

    const link = document.getElementById('lemonsqueezy-checkout-link') as HTMLAnchorElement | null;
    link?.click();
  }, [checkoutUrl]);

  const handleCheckout = async () => {
    if (!user?.id || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const origin = window.location.origin;
    const successUrl = `${origin}/dashboard?subscription=success`;
    const cancelUrl = `${origin}/user-profile-management?subscription=cancel`;

    const { data, error: checkoutError } = await subscriptionService.createCheckout({
      tier: selectedTier,
      billingInterval,
      successUrl,
      cancelUrl,
    });

    if (checkoutError || !data) {
      setError(checkoutError || 'Unable to start checkout.');
      setIsSubmitting(false);
      return;
    }

    setCheckoutUrl(data.checkoutUrl);
    setIsSubmitting(false);
  };

  const handleOpenPortal = async () => {
    if (!subscription?.lemonsqueezySubscriptionId || isPortalLoading) return;

    setIsPortalLoading(true);
    setPortalError(null);

    const { data, error: portalErrorMessage } = await subscriptionService.getCustomerPortalUrls(
      subscription.lemonsqueezySubscriptionId
    );

    if (portalErrorMessage || !data) {
      // Provide more helpful message for auth errors
      const errorMsg =
        portalErrorMessage === 'Unauthorized'
          ? 'Your session has expired. Please sign out and sign back in.'
          : portalErrorMessage || 'Unable to open the customer portal.';
      setPortalError(errorMsg);
      setIsPortalLoading(false);
      return;
    }

    // Use update_payment_method URL for overlay (works with Lemon.js)
    // Fall back to customer_portal_url if needed
    const portalUrl = data.updatePaymentMethodUrl || data.customerPortalUrl;

    if (portalUrl) {
      // Use Lemon.js to open as overlay if available, otherwise fall back to new tab
      if (window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(portalUrl);
      } else {
        window.open(portalUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      setPortalError('No customer portal link is available yet.');
    }

    setIsPortalLoading(false);
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg elevation-1 p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          <p className="text-text-secondary">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg elevation-1 p-6">
      <Script
        src="https://app.lemonsqueezy.com/js/lemon.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.createLemonSqueezy?.();
          window.LemonSqueezy?.Setup({
            eventHandler: (event) => {
              if (event.event === 'Checkout.Success') {
                router.push('/dashboard?subscription=success');
              }
            },
          });
        }}
      />

      <h2 className="text-xl font-semibold text-text-primary mb-6">Subscription</h2>

      {successState === 'cancel' && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          Checkout was cancelled. You can try again anytime.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {subscription ? (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-text-primary">Current Plan</h3>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${getSubscriptionStatusBadge(
                    subscription.status
                  )}`}
                >
                  {subscription.statusFormatted || subscription.status}
                </span>
              </div>
              <p className="text-text-secondary mt-1">
                {getTierEmoji(subscription.tier)} {getTierLabel(subscription.tier)} •{' '}
                {subscription.billingInterval} • ${subscription.amountCents / 100}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {subscription.status === 'cancelled' && subscription.cancelledAt
                  ? `Benefits active until: ${formatDate(subscription.cancelledAt)}`
                  : `Next billing date: ${formatDate(subscription.currentPeriodEnd)}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleOpenPortal}
                disabled={isPortalLoading || !subscription.lemonsqueezySubscriptionId}
                className="px-4 py-2 text-primary rounded-md font-medium text-sm hover:bg-red-600/10 transition-colors duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                title="Open customer portal"
              >
                <Icon name="ArrowTopRightOnSquareIcon" size={16} />
                <span>{isPortalLoading ? 'Opening...' : 'Manage billing'}</span>
              </button>
              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary text-white rounded-md font-medium text-sm hover:bg-red-700 transition-colors duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                title="Change subscription tier"
              >
                <Icon name="SparklesIcon" size={16} />
                <span>{isSubmitting ? 'Starting...' : 'Change tier'}</span>
              </button>
            </div>
          </div>

          {portalError && <p className="text-sm text-destructive">{portalError}</p>}
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-text-secondary">
            Support Scoreboard Manager with a fixed-tier subscription. All tiers unlock the same
            features.
          </p>

          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                billingInterval === 'monthly'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-text-secondary hover:bg-gray-100'
              }`}
              title="Pay monthly"
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                billingInterval === 'yearly'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-text-secondary hover:bg-gray-100'
              }`}
              title="Pay yearly"
            >
              Yearly
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tierList.map((tierPrice) => {
              const price = getDynamicPrice(tierPrice.tier, billingInterval);
              const monthlyEquiv =
                billingInterval === 'yearly' ? getMonthlyEquivalent(tierPrice.tier) : null;
              const isSelected = selectedTier === tierPrice.tier;

              return (
                <button
                  key={tierPrice.tier}
                  onClick={() => setSelectedTier(tierPrice.tier)}
                  className={`border rounded-lg p-4 text-center transition-all duration-150 ${
                    isSelected
                      ? 'border-primary bg-red-600/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:shadow-sm'
                  }`}
                  title={`Select ${tierPrice.label} tier`}
                >
                  <div className="text-3xl mb-2">{tierPrice.emoji}</div>
                  <p className="font-semibold text-text-primary mb-1">{tierPrice.label}</p>
                  <p className="text-2xl font-bold text-primary mb-1">
                    {formatCurrency(price * 100)}
                  </p>
                  <p className="text-xs text-text-secondary">
                    per {billingInterval === 'monthly' ? 'month' : 'year'}
                  </p>
                  {monthlyEquiv && (
                    <p className="text-xs text-text-secondary mt-1">= ${monthlyEquiv}/mo</p>
                  )}
                  {isSelected && (
                    <div className="mt-3">
                      <Icon
                        name="CheckCircleIcon"
                        size={20}
                        className="text-primary mx-auto"
                        variant="solid"
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Icon
                name="InformationCircleIcon"
                size={20}
                className="text-gray-600 flex-shrink-0 mt-0.5"
              />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Tips for supporting</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>All tiers unlock the same features</li>
                  <li>Change your tier anytime from the billing portal</li>
                  <li>Yearly subscriptions save on payment processing fees</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-primary text-white rounded-md font-medium text-sm hover:bg-red-700 transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
            title="Start subscription checkout"
          >
            <Icon name="HeartIcon" size={16} />
            <span>
              {isSubmitting
                ? 'Starting...'
                : `Subscribe to ${getTierLabel(selectedTier)} (${formatCurrency(
                    getDynamicPrice(selectedTier, billingInterval) * 100
                  )}/${billingInterval === 'monthly' ? 'mo' : 'yr'})`}
            </span>
          </button>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Billing History</h3>
        {paymentHistory.length === 0 ? (
          <p className="text-text-secondary">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {paymentHistory.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p className="text-text-primary">
                        {entry.orderItemProductName || 'Subscription'}
                      </p>
                      {entry.orderItemVariantName && (
                        <p className="text-xs text-text-secondary">{entry.orderItemVariantName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {entry.totalCents && entry.currency
                        ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: entry.currency,
                          }).format(entry.totalCents / 100)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {entry.statusFormatted || entry.status || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {entry.receiptUrl ? (
                        <a
                          href={entry.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:bg-red-600/10 px-2 py-1 rounded-md transition-colors duration-150"
                          title="Open receipt"
                        >
                          <Icon name="ArrowTopRightOnSquareIcon" size={14} />
                          <span>View</span>
                        </a>
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <a
        id="lemonsqueezy-checkout-link"
        href={checkoutUrl || '#'}
        className="lemonsqueezy-button hidden"
      >
        Checkout
      </a>
    </div>
  );
}
