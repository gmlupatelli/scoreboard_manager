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

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicHeader from '@/components/common/PublicHeader';
import Footer from '@/components/common/Footer';
import Icon from '@/components/ui/AppIcon';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import {
  TIER_PRICES,
  getTierLabel,
  getTierPrice,
  type AppreciationTier,
} from '@/lib/subscription/tiers';

export const dynamic = 'force-dynamic';

// Declare LemonSqueezy global type
declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

const comparisonRows = [
  { feature: 'Public scoreboards', free: '2', supporter: 'Unlimited' },
  { feature: 'Private scoreboards', free: '—', supporter: 'Unlimited' },
  { feature: 'Entries per scoreboard', free: '50', supporter: 'Unlimited' },
  { feature: 'History snapshots', free: '10', supporter: '100' },
  { feature: 'Theme', free: 'Preset themes', supporter: 'Custom themes' },
  { feature: 'Embeds', free: 'Powered by badge', supporter: 'No badge' },
  { feature: 'Kiosk / TV Mode', free: '—', supporter: 'Included' },
  { feature: 'Team collaboration', free: '—', supporter: 'Included' },
  { feature: 'Support', free: 'Community (GitHub)', supporter: 'Priority email (48h)' },
];

const faqs = [
  {
    question: 'Can I self-host and get all the supporter features for free?',
    answer:
      'Yes. The software is open source under the AGPL v3, so you can self-host with full functionality at no cost beyond your hosting provider.',
  },
  {
    question: 'How does fixed-tier pricing work?',
    answer:
      'Choose from four supporter tiers: Supporter ($4/mo), Champion ($8/mo), Legend ($23/mo), or Hall of Famer ($48/mo). All tiers unlock the same features.',
  },
  {
    question: 'Do higher tiers unlock different features?',
    answer:
      'No. All supporter tiers unlock the same features. Higher tiers simply show more appreciation and help cover hosting costs.',
  },
  {
    question: 'Can I change my tier later?',
    answer:
      'Yes. You can upgrade or downgrade your tier anytime through the billing portal in your profile settings.',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session, loading: authLoading } = useAuth();
  const hasTriggeredCheckout = useRef(false);

  // Read billing and tier params from URL (persisted through registration flow)
  const billingParam = searchParams.get('billing');
  const tierParam = searchParams.get('tier') as AppreciationTier | null;
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    billingParam === 'yearly' ? 'yearly' : 'monthly'
  );
  const [selectedTier, setSelectedTier] = useState<AppreciationTier>(
    tierParam && ['supporter', 'champion', 'legend', 'hall_of_famer'].includes(tierParam)
      ? tierParam
      : 'supporter'
  );
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [autoCheckoutPending, setAutoCheckoutPending] = useState(
    searchParams.get('checkout') === 'true'
  );
  const supporterPrice = `$${getTierPrice(selectedTier, billingCycle)}/${billingCycle === 'monthly' ? 'month' : 'year'}`;

  // Load LemonSqueezy SDK for overlay checkout
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
    script.defer = true;
    script.onload = () => {
      window.createLemonSqueezy?.();
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Auto-trigger checkout when returning from registration/login with checkout=true
  useEffect(() => {
    const shouldCheckout = searchParams.get('checkout') === 'true';
    const billingFromUrl = (searchParams.get('billing') as 'monthly' | 'yearly') || 'monthly';

    // Only need user and valid session - don't wait for full auth loading
    if (shouldCheckout && user && session?.access_token && !hasTriggeredCheckout.current) {
      hasTriggeredCheckout.current = true;
      // Clear the URL params before triggering checkout
      router.replace('/pricing');

      // Trigger checkout with tier and billing from URL to avoid stale state
      const tierFromUrl = (searchParams.get('tier') as AppreciationTier) || 'supporter';
      const validTier = ['supporter', 'champion', 'legend', 'hall_of_famer'].includes(tierFromUrl)
        ? tierFromUrl
        : 'supporter';

      const doCheckout = async () => {
        try {
          setIsCheckoutLoading(true);
          const response = await fetch('/api/lemonsqueezy/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              tier: validTier,
              billingInterval: billingFromUrl,
              successUrl: `${window.location.origin}/dashboard?subscription=success`,
              cancelUrl: `${window.location.origin}/pricing`,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create checkout');
          }

          const { checkoutUrl } = await response.json();
          if (checkoutUrl) {
            // Use overlay if SDK loaded, otherwise fallback to redirect
            if (window.LemonSqueezy?.Url?.Open) {
              window.LemonSqueezy.Url.Open(checkoutUrl);
              setIsCheckoutLoading(false);
              setAutoCheckoutPending(false);
            } else {
              window.location.href = checkoutUrl;
            }
          }
        } catch (err) {
          console.error('Checkout error:', err);
          setIsCheckoutLoading(false);
          setAutoCheckoutPending(false);
        }
      };

      // Small delay to ensure everything is ready
      setTimeout(doCheckout, 300);
    } else if (shouldCheckout && !user && !authLoading) {
      // User not logged in but checkout=true - clear the state
      setAutoCheckoutPending(false);
    }
  }, [user, session, searchParams, router, authLoading]);

  const triggerCheckout = async () => {
    if (!session?.access_token) return;

    setIsCheckoutLoading(true);
    try {
      const response = await fetch('/api/lemonsqueezy/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tier: selectedTier,
          billingInterval: billingCycle,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout');
      }

      const { checkoutUrl } = await response.json();
      // Use overlay if SDK loaded, otherwise fallback to redirect
      if (window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(checkoutUrl);
        setIsCheckoutLoading(false);
      } else {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleBecomeSupporter = async () => {
    // If not logged in, redirect to register with supporter intent
    if (!user || !session?.access_token) {
      router.push(`/register?intent=supporter&tier=${selectedTier}&billing=${billingCycle}`);
      return;
    }

    await triggerCheckout();
  };
  const monthlyButtonClassName =
    'px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-150';
  const monthlyButtonState =
    billingCycle === 'monthly'
      ? 'bg-white text-text-primary shadow-sm'
      : 'text-text-secondary hover:text-text-primary';
  const yearlyButtonClassName =
    'px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-150';
  const yearlyButtonState =
    billingCycle === 'yearly'
      ? 'bg-white text-text-primary shadow-sm'
      : 'text-text-secondary hover:text-text-primary';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Loading overlay when auto-checkout is pending after login */}
      {autoCheckoutPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium text-text-primary">Preparing checkout...</p>
            <p className="text-sm text-text-secondary mt-2">
              Please wait while we set up your supporter subscription.
            </p>
          </div>
        </div>
      )}
      <PublicHeader />
      <main className="flex-1 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Pricing</h1>
            <p className="text-lg text-text-secondary max-w-3xl mx-auto">
              Scoreboard Manager is open source and free to self-host. The hosted app offers fixed
              supporter tiers to help sustain hosting and development.
            </p>
          </div>

          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`${monthlyButtonClassName} ${monthlyButtonState}`}
                title="Show monthly pricing"
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`${yearlyButtonClassName} ${yearlyButtonState}`}
                title="Show yearly pricing"
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-card border border-border rounded-lg p-6 elevation-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="CheckBadgeIcon" size={20} className="text-success" />
                <h2 className="text-2xl font-semibold text-text-primary">Free</h2>
              </div>
              <p className="text-text-secondary mb-4">Use the hosted app for free.</p>
              <div className="text-3xl font-bold text-text-primary mb-4">$0</div>
              <ul className="space-y-2 text-text-secondary flex-1">
                <li className="flex items-center gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success" />
                  <span>2 public scoreboards</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success" />
                  <span>50 entries per scoreboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success" />
                  <span>10 history snapshots per scoreboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success" />
                  <span>Presets themes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success" />
                  <span>Community support (GitHub Issues)</span>
                </li>
              </ul>
              <div className="mt-auto pt-6">
                <Button
                  href="/register"
                  variant="outline"
                  size="md"
                  icon="ArrowRightIcon"
                  iconPosition="right"
                  title="Start with the hosted app"
                >
                  Sign Up for Free
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 elevation-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="GiftIcon" size={20} className="text-primary" />
                <h2 className="text-2xl font-semibold text-text-primary">
                  {getTierLabel(selectedTier)}
                </h2>
              </div>
              <p className="text-text-secondary mb-4">
                Choose your tier to support hosting and unlock all features.
              </p>

              {/* Tier Selector */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {TIER_PRICES.filter((tier) => tier.tier !== 'appreciation').map((tier) => {
                  const isSelected = selectedTier === tier.tier;
                  const price = getTierPrice(tier.tier, billingCycle);
                  return (
                    <button
                      key={tier.tier}
                      onClick={() => setSelectedTier(tier.tier)}
                      className={`p-2 rounded-lg border-2 transition-all duration-150 flex flex-col items-center ${
                        isSelected
                          ? 'border-primary bg-red-600/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      title={`Select ${tier.label} tier`}
                    >
                      <span className="text-lg">{tier.emoji}</span>
                      <span className="text-xs font-medium text-text-primary">${price}</span>
                    </button>
                  );
                })}
              </div>

              <div className="text-3xl font-bold text-text-primary mb-4">
                {supporterPrice}
                <span className="text-base font-normal text-text-secondary ml-2">
                  {getTierLabel(selectedTier)}
                </span>
              </div>
              <ul className="space-y-2 text-text-secondary flex-1">
                <li className="flex items-center gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success" />
                  <span>Unlimited public & private scoreboards</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success" />
                  <span>Unlimited entries</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success" />
                  <span>100 history snapshots per scoreboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success" />
                  <span>Custom themes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success" />
                  <span>No “Powered by” badge on embeds</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success" />
                  <span>Kiosk / TV Mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success" />
                  <span>Team collaboration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success" />
                  <span>Priority email support (48h response)</span>
                </li>
              </ul>
              <div className="mt-auto pt-6">
                <Button
                  onClick={handleBecomeSupporter}
                  variant="primary"
                  size="md"
                  icon={isCheckoutLoading ? undefined : 'ArrowRightIcon'}
                  iconPosition="right"
                  title="Start subscription checkout"
                  disabled={isCheckoutLoading}
                >
                  {isCheckoutLoading ? 'Loading...' : `Become a ${getTierLabel(selectedTier)}`}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">Compare plans</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-text-secondary">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Feature</th>
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Free</th>
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">
                      Supporter (All Tiers)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.feature} className="border-b border-border last:border-0">
                      <td className="py-3 px-4">{row.feature}</td>
                      <td className="py-3 px-4">{row.free}</td>
                      <td className="py-3 px-4">{row.supporter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">FAQ</h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question} className="border-b border-border pb-6 last:border-0">
                  <h3 className="font-medium text-text-primary mb-2 flex items-start gap-3">
                    <Icon
                      name="QuestionMarkCircleIcon"
                      size={20}
                      className="text-primary flex-shrink-0 mt-0.5"
                    />
                    {faq.question}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed pl-8">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
