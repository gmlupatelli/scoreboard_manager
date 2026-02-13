/**
 * Shared subscription utilities
 * Extracted to avoid duplication across subscription-related components.
 */

import { SubscriptionStatus } from '@/types/models';

/**
 * Get CSS classes for a subscription status badge.
 * Used in admin panel, user profile, and supporter plan pages.
 */
export const getSubscriptionStatusBadge = (status: SubscriptionStatus): string => {
  switch (status) {
    case 'active':
      return 'bg-green-500/10 text-success';
    case 'trialing':
      return 'bg-yellow-500/10 text-warning';
    case 'past_due':
      return 'bg-orange-500/10 text-orange-600';
    case 'unpaid':
      return 'bg-red-500/10 text-destructive';
    case 'paused':
      return 'bg-muted text-text-secondary';
    case 'expired':
    case 'cancelled':
      return 'bg-red-500/10 text-destructive';
    default:
      return 'bg-muted text-text-secondary';
  }
};

/**
 * Get a human-readable label for a subscription status
 */
export const getSubscriptionStatusLabel = (status: SubscriptionStatus): string => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'trialing':
      return 'Trial';
    case 'past_due':
      return 'Past Due';
    case 'unpaid':
      return 'Unpaid';
    case 'paused':
      return 'Paused';
    case 'expired':
      return 'Expired';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};
