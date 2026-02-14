import { AppreciationTier, PaymentHistoryEntry } from '@/types/models';

// ============================================================================
// Subscription Management — Shared Types
// ============================================================================

export interface UserSubscription {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  createdAt: string;
  subscription: {
    id: string;
    status: string;
    statusFormatted: string | null;
    tier: AppreciationTier;
    billingInterval: string;
    amountCents: number;
    currency: string;
    isGifted: boolean;
    giftedExpiresAt: string | null;
    currentPeriodEnd: string | null;
    lemonsqueezySubscriptionId: string | null;
    paymentFailureCount: number;
    lastPaymentFailedAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export type FilterType = 'all' | 'active' | 'cancelled' | 'past_due' | 'appreciation' | 'free';

// ============================================================================
// User Details Modal — API Response Types
// ============================================================================

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  hasMore: boolean;
}

export interface UserDetailsProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: 'system_admin' | 'user';
  createdAt: string;
  emailVerified: boolean;
  lastSignInAt: string | null;
}

export interface ScoreboardSummary {
  id: string;
  title: string;
  visibility: 'public' | 'private';
  entryCount: number;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actionLabel: string;
  details: Record<string, unknown>;
  createdAt: string;
  admin: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
}

export interface UserDetailsSubscription {
  id: string;
  status: string;
  statusFormatted: string | null;
  tier: AppreciationTier;
  billingInterval: string;
  amountCents: number;
  currency: string;
  isGifted: boolean;
  giftedExpiresAt: string | null;
  currentPeriodEnd: string | null;
  lemonsqueezySubscriptionId: string | null;
  paymentFailureCount: number;
  lastPaymentFailedAt: string | null;
  cardBrand: string | null;
  cardLastFour: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserDetailsResponse {
  user: UserDetailsProfile;
  subscription: UserDetailsSubscription | null;
  paymentHistory: {
    payments: PaymentHistoryEntry[];
    pagination: PaginationMeta;
  };
  scoreboards: {
    scoreboards: ScoreboardSummary[];
    pagination: PaginationMeta;
  };
  auditLog: {
    entries: AuditLogEntry[];
    pagination: PaginationMeta;
  };
}
