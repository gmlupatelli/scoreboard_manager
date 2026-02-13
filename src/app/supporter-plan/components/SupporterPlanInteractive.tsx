/*
 * Scoreboard Manager
 * Copyright (c) 2026 Scoreboard Manager contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Icon from '@/components/ui/AppIcon';
import TierBadge from '@/components/ui/TierBadge';
import DowngradeNoticeModal from '@/components/common/DowngradeNoticeModal';
import SupporterSection from '@/app/user-profile-management/components/SupporterSection';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService } from '@/services/subscriptionService';
import { PaymentHistoryEntry, Subscription } from '@/types/models';
import {
  TIER_PRICES,
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

const getStatusBadge = (status: Subscription['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-500/10 text-success';
    case 'trialing':
      return 'bg-yellow-500/10 text-warning';
    case 'past_due':
    case 'unpaid':
      return 'bg-yellow-500/10 text-warning';
    case 'paused':
      return 'bg-muted text-text-secondary';
    case 'expired':
    case 'cancelled':
      return 'bg-red-500/10 text-destructive';
    default:
      return 'bg-muted text-text-secondary';
  }
};

export default function SupporterPlanInteractive() {
  const { user, loading: authLoading, subscriptionTier, refreshSubscription } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [selectedTier, setSelectedTier] = useState<AppreciationTier>('supporter');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [isChangingTier, setIsChangingTier] = useState(false);
  const [changeTierError, setChangeTierError] = useState<string | null>(null);
  const [changeTierSuccess, setChangeTierSuccess] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showDowngradeNotice, setShowDowngradeNotice] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

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

    loadSubscription();
  }, [user?.id]);

  // Redirect to dashboard on successful checkout
  // The dashboard handles the success toast and subscription refresh
  useEffect(() => {
    if (successState === 'success') {
      router.replace('/dashboard?subscription=success');
    }
  }, [successState, router]);

  const handleCheckout = async () => {
    if (!user?.id || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const origin = window.location.origin;
    const successUrl = `${origin}/dashboard?subscription=success`;
    const cancelUrl = `${origin}/supporter-plan?subscription=cancel`;

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

    // Open checkout in overlay
    if (window.LemonSqueezy?.Url) {
      window.LemonSqueezy.Url.Open(data.checkoutUrl);
    } else {
      window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer');
    }

    setIsSubmitting(false);
  };

  const handleChangeTier = async () => {
    if (!subscription?.lemonsqueezySubscriptionId || isSubmitting) return;

    // Check if user selected the same tier and billing interval
    if (selectedTier === subscription.tier && billingInterval === subscription.billingInterval) {
      setChangeTierError('Please select a different tier or billing interval.');
      return;
    }

    setIsSubmitting(true);
    setChangeTierError(null);
    setChangeTierSuccess(null);

    const { data, error: updateError } = await subscriptionService.updateSubscription({
      subscriptionId: subscription.lemonsqueezySubscriptionId,
      tier: selectedTier,
      billingInterval,
    });

    if (updateError || !data) {
      setChangeTierError(updateError || 'Unable to update subscription.');
      setIsSubmitting(false);
      return;
    }

    // Check if PayPal subscription requires portal
    if (data.requiresPortal && data.portalUrl) {
      setChangeTierError(data.message || 'Please update your subscription through the portal.');
      if (window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(data.portalUrl);
      } else {
        window.open(data.portalUrl, '_blank', 'noopener,noreferrer');
      }
      setIsSubmitting(false);
      return;
    }

    // Success - refresh subscription data
    setChangeTierSuccess('Your subscription has been updated successfully!');
    setIsChangingTier(false);

    // Update local subscription state immediately with the returned data
    if (subscription && data.subscription) {
      setSubscription({
        ...subscription,
        tier: data.subscription.tier as AppreciationTier,
        billingInterval: data.subscription.billingInterval as BillingInterval,
        amountCents: data.subscription.amountCents || subscription.amountCents,
      });
    }

    // Also refresh from database to ensure consistency (for other fields)
    if (user?.id) {
      // Small delay to ensure database has been updated
      setTimeout(async () => {
        const { data: newSubscription } = await subscriptionService.getSubscription(user.id);
        if (newSubscription) {
          setSubscription(newSubscription);
        }
      }, 500);
    }

    if (refreshSubscription) {
      refreshSubscription();
    }

    setIsSubmitting(false);

    // Clear success message after 5 seconds
    setTimeout(() => {
      setChangeTierSuccess(null);
    }, 5000);
  };

  const handleResumeSubscription = async () => {
    if (!subscription?.lemonsqueezySubscriptionId || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const { data, error: resumeError } = await subscriptionService.resumeSubscription(
      subscription.lemonsqueezySubscriptionId
    );

    if (resumeError || !data) {
      setError(resumeError || 'Unable to resume subscription.');
      setIsSubmitting(false);
      return;
    }

    // Success - refresh subscription data
    setChangeTierSuccess('Your subscription has been reactivated!');

    // Refresh subscription data
    if (user?.id) {
      setTimeout(async () => {
        const { data: newSubscription } = await subscriptionService.getSubscription(user.id);
        if (newSubscription) {
          setSubscription(newSubscription);
        }
      }, 500);
    }

    if (refreshSubscription) {
      refreshSubscription();
    }

    setIsSubmitting(false);

    // Clear success message after 5 seconds
    setTimeout(() => {
      setChangeTierSuccess(null);
    }, 5000);
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

  const handleCancelSubscription = async () => {
    if (!subscription?.lemonsqueezySubscriptionId || isCancelling) return;

    setIsCancelling(true);
    setError(null);

    const { data, error: cancelError } = await subscriptionService.cancelSubscription(
      subscription.lemonsqueezySubscriptionId
    );

    if (cancelError || !data) {
      setError(cancelError || 'Unable to cancel subscription.');
      setIsCancelling(false);
      setShowCancelConfirm(false);
      return;
    }

    // Success - update local state and close modal
    setShowCancelConfirm(false);
    setChangeTierSuccess(
      'Your subscription has been cancelled. You will retain access until the end of your current billing period.'
    );
    setShowDowngradeNotice(true);

    // Refresh subscription data
    if (user?.id) {
      setTimeout(async () => {
        const { data: newSubscription } = await subscriptionService.getSubscription(user.id);
        if (newSubscription) {
          setSubscription(newSubscription);
        }
      }, 500);
    }

    if (refreshSubscription) {
      refreshSubscription();
    }

    setIsCancelling(false);

    // Clear success message after 8 seconds (longer for important message)
    setTimeout(() => {
      setChangeTierSuccess(null);
    }, 8000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header isAuthenticated={!!user} />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header isAuthenticated={false} />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center">
            <Icon name="LockClosedIcon" size={48} className="text-text-secondary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-text-primary mb-2">Sign in required</h1>
            <p className="text-text-secondary mb-4">Please sign in to view your supporter plan.</p>
            <Link
              href="/login?returnTo=/supporter-plan"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md font-medium text-sm hover:bg-red-700 transition-colors duration-150"
            >
              <Icon name="ArrowRightOnRectangleIcon" size={16} />
              Sign In
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Gifted/appreciation subscriptions should not be treated as paid subscriptions
  // so users still see pricing options and can become a paid supporter
  const isGiftedSubscription = subscription?.isGifted && subscription?.tier === 'appreciation';

  const isActiveSubscriber =
    subscription && ['active', 'trialing'].includes(subscription.status) && !isGiftedSubscription;

  // Check if subscription is cancelled but still within grace period (benefits still active)
  // LemonSqueezy's ends_at (stored as cancelledAt) is the actual expiry deadline
  const isCancelledButActive =
    subscription &&
    subscription.status === 'cancelled' &&
    subscription.cancelledAt &&
    new Date(subscription.cancelledAt) > new Date() &&
    !isGiftedSubscription;

  // User still has benefits if active or cancelled-but-active
  const hasActiveSubscription = isActiveSubscriber || isCancelledButActive;

  return (
    <div className="min-h-screen flex flex-col bg-background">
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

      <Header isAuthenticated={true} />

      <main className="flex-1 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Supporter Plan</h1>
              <p className="text-text-secondary">
                Manage your subscription and view billing history
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-colors duration-150"
              >
                <Icon name="ArrowLeftIcon" size={18} />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Cancel Message */}
          {successState === 'cancel' && (
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700 flex items-center gap-2">
              <Icon name="ExclamationTriangleIcon" size={20} />
              Checkout was cancelled. You can try again anytime.
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <Icon name="ExclamationCircleIcon" size={20} />
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="bg-card border border-border rounded-lg p-8 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <p className="text-text-secondary">Loading subscription details...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Plan Card */}
              <div className="bg-card border border-border rounded-lg elevation-1 p-6" data-testid="current-plan-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Current Plan</h2>
                  <TierBadge tier={subscriptionTier} size="md" />
                </div>

                {hasActiveSubscription ? (
                  <div className="space-y-4">
                    {/* Cancellation Warning Banner */}
                    {isCancelledButActive && (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Icon
                            name="ExclamationTriangleIcon"
                            size={20}
                            className="text-warning flex-shrink-0 mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-warning">
                              Subscription Cancelled
                            </p>
                            <p className="text-sm text-text-secondary mt-1">
                              Your subscription has been cancelled, but you still have access to all
                              supporter benefits until{' '}
                              <strong className="text-text-primary">
                                {formatDate(subscription.cancelledAt)}
                              </strong>
                              .
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success message */}
                    {changeTierSuccess && (
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center gap-2 text-success">
                          <Icon name="CheckCircleIcon" size={20} />
                          <p className="text-sm font-medium">{changeTierSuccess}</p>
                        </div>
                      </div>
                    )}

                    {!isChangingTier ? (
                      <>
                        {/* Current plan info */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getTierEmoji(subscription.tier)}</span>
                              <span className="text-xl font-semibold text-text-primary">
                                {getTierLabel(subscription.tier)}
                              </span>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadge(
                                  subscription.status
                                )}`}
                                data-testid="subscription-status-badge"
                              >
                                {subscription.statusFormatted || subscription.status}
                              </span>
                            </div>
                            <p className="text-text-secondary mt-1">
                              {formatCurrency(subscription.amountCents)} /{' '}
                              {subscription.billingInterval}
                            </p>
                          </div>
                          <div className="text-sm text-text-secondary">
                            {isCancelledButActive
                              ? `Benefits active until: ${formatDate(subscription.cancelledAt)}`
                              : `Next billing: ${formatDate(subscription.currentPeriodEnd)}`}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={handleOpenPortal}
                            disabled={isPortalLoading || !subscription.lemonsqueezySubscriptionId}
                            className="px-4 py-2 bg-primary text-white rounded-md font-medium text-sm hover:bg-red-700 transition-colors duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                            title="Manage your subscription in customer portal"
                            data-testid="manage-billing-button"
                          >
                            <Icon name="ArrowTopRightOnSquareIcon" size={16} />
                            <span>{isPortalLoading ? 'Opening...' : 'Manage Billing'}</span>
                          </button>
                          {isCancelledButActive ? (
                            <button
                              onClick={handleResumeSubscription}
                              disabled={isSubmitting}
                              className="px-4 py-2 bg-primary text-white rounded-md font-medium text-sm hover:bg-red-700 transition-colors duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                              title="Reactivate your subscription"
                            >
                              <Icon name="ArrowPathIcon" size={16} />
                              <span>
                                {isSubmitting ? 'Reactivating...' : 'Reactivate Subscription'}
                              </span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setIsChangingTier(true);
                                  setSelectedTier(subscription.tier);
                                  setBillingInterval(subscription.billingInterval);
                                  setChangeTierError(null);
                                }}
                                disabled={isSubmitting || !subscription.lemonsqueezySubscriptionId}
                                className="px-4 py-2 text-primary rounded-md font-medium text-sm hover:bg-red-600/10 transition-colors duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                title="Change your subscription tier"
                              >
                                <Icon name="SparklesIcon" size={16} />
                                <span>Change Tier</span>
                              </button>
                              <button
                                onClick={() => setShowCancelConfirm(true)}
                                disabled={isSubmitting || !subscription.lemonsqueezySubscriptionId}
                                className="px-4 py-2 text-destructive rounded-md font-medium text-sm hover:bg-red-500/10 transition-colors duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                title="Cancel your subscription"
                              >
                                <Icon name="XCircleIcon" size={16} />
                                <span>Cancel Subscription</span>
                              </button>
                            </>
                          )}
                        </div>

                        {portalError && <p className="text-sm text-destructive">{portalError}</p>}
                      </>
                    ) : (
                      <>
                        {/* Tier Selection for existing subscribers */}
                        <div className="space-y-6">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-text-secondary">
                              Select a new tier below. Your subscription will be prorated based on
                              your current billing cycle.
                            </p>
                          </div>

                          {/* Tier Selection */}
                          <div>
                            <h3 className="text-sm font-medium text-text-primary mb-3">
                              Choose a new tier
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {TIER_PRICES.filter((tier) => tier.tier !== 'appreciation').map(
                                (tier) => (
                                  <button
                                    key={tier.tier}
                                    onClick={() => setSelectedTier(tier.tier)}
                                    className={`p-4 rounded-lg border-2 text-center transition-all duration-150 ${
                                      selectedTier === tier.tier
                                        ? 'border-primary bg-red-600/5'
                                        : 'border-border hover:border-primary/50'
                                    } ${tier.tier === subscription.tier ? 'ring-2 ring-offset-2 ring-green-500/50' : ''}`}
                                    data-testid="tier-card"
                                  >
                                    <span className="text-2xl block mb-1">{tier.emoji}</span>
                                    <span className="font-medium text-text-primary block">
                                      {tier.label}
                                    </span>
                                    <span className="text-sm text-text-secondary">
                                      ${billingInterval === 'monthly' ? tier.monthly : tier.yearly}/
                                      {billingInterval === 'monthly' ? 'mo' : 'yr'}
                                    </span>
                                    {tier.tier === subscription.tier && (
                                      <span className="text-xs text-success block mt-1">
                                        Current
                                      </span>
                                    )}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          {/* Billing Interval */}
                          <div>
                            <h3 className="text-sm font-medium text-text-primary mb-3">
                              Billing interval
                            </h3>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setBillingInterval('monthly')}
                                className={`flex-1 p-3 rounded-lg border-2 text-center transition-all duration-150 ${
                                  billingInterval === 'monthly'
                                    ? 'border-primary bg-red-600/5'
                                    : 'border-border hover:border-primary/50'
                                } ${subscription.billingInterval === 'monthly' ? 'ring-2 ring-offset-2 ring-green-500/50' : ''}`}
                              >
                                <span className="font-medium text-text-primary">Monthly</span>
                                {subscription.billingInterval === 'monthly' && (
                                  <span className="text-xs text-success block">Current</span>
                                )}
                              </button>
                              <button
                                onClick={() => setBillingInterval('yearly')}
                                className={`flex-1 p-3 rounded-lg border-2 text-center transition-all duration-150 ${
                                  billingInterval === 'yearly'
                                    ? 'border-primary bg-red-600/5'
                                    : 'border-border hover:border-primary/50'
                                } ${subscription.billingInterval === 'yearly' ? 'ring-2 ring-offset-2 ring-green-500/50' : ''}`}
                              >
                                <span className="font-medium text-text-primary">
                                  Yearly <span className="text-success">(Save ~17%)</span>
                                </span>
                                {subscription.billingInterval === 'yearly' && (
                                  <span className="text-xs text-success block">Current</span>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Error message */}
                          {changeTierError && (
                            <p className="text-sm text-destructive">{changeTierError}</p>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => {
                                setIsChangingTier(false);
                                setChangeTierError(null);
                              }}
                              disabled={isSubmitting}
                              className="px-4 py-2 text-text-secondary rounded-md font-medium text-sm hover:bg-muted transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleChangeTier}
                              disabled={
                                isSubmitting ||
                                (selectedTier === subscription.tier &&
                                  billingInterval === subscription.billingInterval)
                              }
                              className="px-4 py-2 bg-primary text-white rounded-md font-medium text-sm hover:bg-red-700 transition-colors duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                              title="Confirm tier change"
                            >
                              <Icon name="CheckIcon" size={16} />
                              <span>{isSubmitting ? 'Updating...' : 'Confirm Change'}</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {isGiftedSubscription ? (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <span className="text-xl flex-shrink-0">🎁</span>
                          <div className="text-sm">
                            <p className="font-medium text-purple-700">Appreciation Tier Active</p>
                            <p className="text-purple-600 mt-1">
                              You have a gifted appreciation tier with full feature access.
                              {subscription?.giftedExpiresAt ? (
                                <>
                                  {' '}
                                  This tier expires on{' '}
                                  <strong>
                                    {new Date(subscription.giftedExpiresAt).toLocaleDateString(
                                      undefined,
                                      {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      }
                                    )}
                                  </strong>
                                  .
                                </>
                              ) : null}{' '}
                              Becoming a paid supporter helps keep Scoreboard Manager running and
                              will replace your appreciation tier.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-text-secondary">
                          You&apos;re currently on the <strong>Free</strong> plan. Become a
                          supporter to unlock additional features and help keep Scoreboard Manager
                          running!
                        </p>
                      </div>
                    )}

                    {/* Tier Selection */}
                    <div>
                      <h3 className="text-sm font-medium text-text-primary mb-3">Choose a tier</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {TIER_PRICES.filter((tier) => tier.tier !== 'appreciation').map((tier) => (
                          <button
                            key={tier.tier}
                            onClick={() => setSelectedTier(tier.tier)}
                            className={`p-4 rounded-lg border-2 text-center transition-all duration-150 ${
                              selectedTier === tier.tier
                                ? 'border-primary bg-red-600/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            data-testid="tier-card"
                          >
                            <span className="text-2xl block mb-1">{tier.emoji}</span>
                            <span className="font-medium text-text-primary block">
                              {tier.label}
                            </span>
                            <span className="text-sm text-text-secondary">
                              ${billingInterval === 'monthly' ? tier.monthly : tier.yearly}/
                              {billingInterval === 'monthly' ? 'mo' : 'yr'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Billing Interval */}
                    <div>
                      <h3 className="text-sm font-medium text-text-primary mb-3">
                        Billing interval
                      </h3>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setBillingInterval('monthly')}
                          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors duration-150 ${
                            billingInterval === 'monthly'
                              ? 'bg-primary text-white'
                              : 'bg-muted text-text-secondary hover:bg-muted/80'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setBillingInterval('yearly')}
                          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors duration-150 ${
                            billingInterval === 'yearly'
                              ? 'bg-primary text-white'
                              : 'bg-muted text-text-secondary hover:bg-muted/80'
                          }`}
                        >
                          Yearly
                          <span className="ml-1 text-xs opacity-75">(Save ~17%)</span>
                        </button>
                      </div>
                    </div>

                    {/* Subscribe Button */}
                    <button
                      onClick={handleCheckout}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-primary text-white rounded-md font-medium text-sm hover:bg-red-700 transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                      title="Subscribe to selected tier"
                      data-testid="checkout-button"
                    >
                      <Icon name="HeartIcon" size={18} />
                      <span>
                        {isSubmitting
                          ? 'Starting checkout...'
                          : `Become a ${getTierLabel(selectedTier)}`}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Supporter Recognition */}
              <SupporterSection onToast={showToast} />

              {/* Billing History */}
              <div className="bg-card border border-border rounded-lg elevation-1 overflow-hidden" data-testid="billing-history-section">
                <div className="px-6 pt-6 pb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Billing History</h2>
                </div>
                {paymentHistory.length === 0 ? (
                  <div className="px-6 pb-6">
                    <p className="text-text-secondary">No payments recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Item</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="bg-surface divide-y divide-border">
                        {paymentHistory.map((payment) => (
                          <tr key={payment.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-sm text-text-secondary">
                              {formatDate(payment.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <p className="text-text-primary">
                                {payment.orderItemProductName || 'Subscription'}
                              </p>
                              {payment.orderItemVariantName && (
                                <p className="text-xs text-text-secondary">
                                  {payment.orderItemVariantName}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-text-primary">
                              {payment.totalCents && payment.currency
                                ? new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: payment.currency,
                                  }).format(payment.totalCents / 100)
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-text-secondary">
                              {payment.statusFormatted || payment.status || '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {payment.receiptUrl ? (
                                <a
                                  href={payment.receiptUrl}
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

              {/* Supporter Benefits */}
              <div className="bg-card border border-border rounded-lg elevation-1 p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Supporter Benefits</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Icon
                      name="CheckCircleIcon"
                      size={20}
                      className="text-success flex-shrink-0 mt-0.5"
                    />
                    <span className="text-text-secondary">
                      Unlimited public & private scoreboards
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon
                      name="CheckCircleIcon"
                      size={20}
                      className="text-success flex-shrink-0 mt-0.5"
                    />
                    <span className="text-text-secondary">Unlimited entries</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon
                      name="CheckCircleIcon"
                      size={20}
                      className="text-success flex-shrink-0 mt-0.5"
                    />
                    <span className="text-text-secondary">
                      100 history snapshots per scoreboard
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon
                      name="CheckCircleIcon"
                      size={20}
                      className="text-success flex-shrink-0 mt-0.5"
                    />
                    <span className="text-text-secondary">Custom themes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon
                      name="CheckCircleIcon"
                      size={20}
                      className="text-success flex-shrink-0 mt-0.5"
                    />
                    <span className="text-text-secondary">
                      No &quot;Powered by&quot; badge on embeds
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon
                      name="CheckCircleIcon"
                      size={20}
                      className="text-success flex-shrink-0 mt-0.5"
                    />
                    <span className="text-text-secondary">Kiosk / TV Mode</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon
                      name="CheckCircleIcon"
                      size={20}
                      className="text-success flex-shrink-0 mt-0.5"
                    />
                    <span className="text-text-secondary">Team collaboration</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon
                      name="CheckCircleIcon"
                      size={20}
                      className="text-success flex-shrink-0 mt-0.5"
                    />
                    <span className="text-text-secondary">
                      Priority email support (48h response)
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            <Icon
              name={toast.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'}
              size={18}
            />
            {toast.message}
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface rounded-lg shadow-lg max-w-md w-full mx-4 p-6" data-testid="cancel-subscription-modal">
            <div className="flex items-start gap-3 mb-4">
              <Icon
                name="ExclamationTriangleIcon"
                size={24}
                className="text-warning flex-shrink-0"
              />
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Cancel Subscription?</h3>
                <p className="text-text-secondary text-sm mt-1">
                  Are you sure you want to cancel your subscription?
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>What happens when you cancel:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-amber-800 mt-2 space-y-1">
                <li>You&apos;ll keep your benefits until the end of your current billing period</li>
                <li>No further charges will be made</li>
                <li>After your plan ends, Free plan limits apply:</li>
                <li>2 public scoreboards maximum</li>
                <li>Private scoreboards are locked</li>
                <li>50 entries per scoreboard maximum</li>
                <li>Preset themes only</li>
                <li>Powered by badge on embeds</li>
                <li>Kiosk / TV Mode disabled</li>
                <li>You can resubscribe anytime to remove these limits</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCancelling}
                className="px-4 py-2 bg-muted text-text-primary rounded-md font-medium text-sm hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted transition-colors duration-150"
                data-testid="keep-subscription-button"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="px-4 py-2 bg-destructive text-white rounded-md font-medium text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-destructive transition-colors duration-150 flex items-center gap-2"
                data-testid="confirm-cancel-button"
              >
                {isCancelling ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Yes, Cancel Subscription</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <DowngradeNoticeModal
        isOpen={showDowngradeNotice}
        onDismiss={() => setShowDowngradeNotice(false)}
        mode="cancelled"
      />
    </div>
  );
}
