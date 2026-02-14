'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscriptionService } from '@/services/subscriptionService';
import Icon from '@/components/ui/AppIcon';
import TierBadge from '@/components/ui/TierBadge';
import {
  UserSubscription,
  UserDetailsResponse,
  UserDetailsProfile,
  UserDetailsSubscription,
  ScoreboardSummary,
  AuditLogEntry,
} from '../types';
import { PaymentHistoryEntry } from '@/types/models';

interface UserDetailsModalProps {
  user: UserSubscription;
  onClose: () => void;
}

type TabId = 'profile' | 'payments' | 'scoreboards' | 'activity';

interface TabDef {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { id: 'profile', label: 'Profile', icon: 'UserCircleIcon' },
  { id: 'payments', label: 'Payments', icon: 'CreditCardIcon' },
  { id: 'scoreboards', label: 'Scoreboards', icon: 'TrophyIcon' },
  { id: 'activity', label: 'Activity', icon: 'ClockIcon' },
];

export default function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [userProfile, setUserProfile] = useState<UserDetailsProfile | null>(null);
  const [subscription, setSubscription] = useState<UserDetailsSubscription | null>(null);
  const [payments, setPayments] = useState<PaymentHistoryEntry[]>([]);
  const [paymentsHasMore, setPaymentsHasMore] = useState(false);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [isLoadingMorePayments, setIsLoadingMorePayments] = useState(false);
  const [scoreboards, setScoreboards] = useState<ScoreboardSummary[]>([]);
  const [scoreboardsHasMore, setScoreboardsHasMore] = useState(false);
  const [scoreboardsTotal, setScoreboardsTotal] = useState(0);
  const [scoreboardsPage, setScoreboardsPage] = useState(1);
  const [isLoadingMoreScoreboards, setIsLoadingMoreScoreboards] = useState(false);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [auditHasMore, setAuditHasMore] = useState(false);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [isLoadingMoreAudit, setIsLoadingMoreAudit] = useState(false);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Initial data fetch
  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await subscriptionService.getUserDetailsAdmin(user.id);

      if (fetchError || !data) {
        setError(fetchError || 'Failed to load user details');
        setIsLoading(false);
        return;
      }

      const response = data as UserDetailsResponse;
      setUserProfile(response.user);
      setSubscription(response.subscription);
      setPayments(response.paymentHistory.payments);
      setPaymentsHasMore(response.paymentHistory.pagination.hasMore);
      setPaymentsTotal(response.paymentHistory.pagination.total);
      setScoreboards(response.scoreboards.scoreboards);
      setScoreboardsHasMore(response.scoreboards.pagination.hasMore);
      setScoreboardsTotal(response.scoreboards.pagination.total);
      setAuditEntries(response.auditLog.entries);
      setAuditHasMore(response.auditLog.pagination.hasMore);
      setAuditTotal(response.auditLog.pagination.total);
      setIsLoading(false);
    };

    void fetchDetails();
  }, [user.id]);

  // Load More handlers
  const handleLoadMorePayments = useCallback(async () => {
    const nextPage = paymentsPage + 1;
    setIsLoadingMorePayments(true);

    const { data, error: fetchError } = await subscriptionService.getUserDetailsAdmin(user.id, {
      section: 'payments',
      paymentsPage: nextPage,
    });

    if (!fetchError && data?.paymentHistory) {
      setPayments((prev) => [...prev, ...data.paymentHistory.payments]);
      setPaymentsHasMore(data.paymentHistory.pagination.hasMore);
      setPaymentsPage(nextPage);
    }
    setIsLoadingMorePayments(false);
  }, [user.id, paymentsPage]);

  const handleLoadMoreScoreboards = useCallback(async () => {
    const nextPage = scoreboardsPage + 1;
    setIsLoadingMoreScoreboards(true);

    const { data, error: fetchError } = await subscriptionService.getUserDetailsAdmin(user.id, {
      section: 'scoreboards',
      scoreboardsPage: nextPage,
    });

    if (!fetchError && data?.scoreboards) {
      setScoreboards((prev) => [...prev, ...data.scoreboards.scoreboards]);
      setScoreboardsHasMore(data.scoreboards.pagination.hasMore);
      setScoreboardsPage(nextPage);
    }
    setIsLoadingMoreScoreboards(false);
  }, [user.id, scoreboardsPage]);

  const handleLoadMoreAudit = useCallback(async () => {
    const nextPage = auditPage + 1;
    setIsLoadingMoreAudit(true);

    const { data, error: fetchError } = await subscriptionService.getUserDetailsAdmin(user.id, {
      section: 'auditLog',
      auditLogPage: nextPage,
    });

    if (!fetchError && data?.auditLog) {
      setAuditEntries((prev) => [...prev, ...data.auditLog.entries]);
      setAuditHasMore(data.auditLog.pagination.hasMore);
      setAuditPage(nextPage);
    }
    setIsLoadingMoreAudit(false);
  }, [user.id, auditPage]);

  // Formatting helpers
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (cents: number | null | undefined, currency: string | null | undefined) => {
    if (cents == null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(cents / 100);
  };

  const getStatusBadgeClass = (status: string): string => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      trialing: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
      past_due: 'bg-orange-100 text-orange-700',
      paused: 'bg-gray-100 text-gray-600',
      expired: 'bg-gray-100 text-gray-600',
      unpaid: 'bg-red-100 text-red-700',
      paid: 'bg-green-100 text-green-700',
      refunded: 'bg-yellow-100 text-yellow-700',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-600';
  };

  // ============================================================================
  // Tab content renderers
  // ============================================================================

  const renderProfileTab = () => {
    if (!userProfile) return null;

    return (
      <div className="space-y-6">
        {/* User Information */}
        <div>
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
            Account Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoField label="Email" value={userProfile.email} />
            <InfoField label="Full Name" value={userProfile.fullName || 'Not set'} />
            <InfoField label="Role">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  userProfile.role === 'system_admin'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {userProfile.role === 'system_admin' ? 'System Admin' : 'User'}
              </span>
            </InfoField>
            <InfoField label="Account Created" value={formatDate(userProfile.createdAt)} />
            <InfoField
              label="Last Sign In"
              value={formatDateTime(userProfile.lastSignInAt) || 'Never'}
            />
            <InfoField label="Email Verified">
              {userProfile.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                  <Icon name="CheckCircleIcon" size={16} />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-orange-600 text-sm">
                  <Icon name="ExclamationCircleIcon" size={16} />
                  Not verified
                </span>
              )}
            </InfoField>
          </div>
        </div>

        {/* Subscription Information */}
        <div>
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
            Subscription
          </h3>
          {subscription ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="Status">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(subscription.status)}`}
                >
                  {subscription.statusFormatted || subscription.status}
                </span>
              </InfoField>
              <InfoField label="Tier">
                <TierBadge tier={subscription.tier} />
              </InfoField>
              {subscription.isGifted ? (
                <InfoField label="Gift Expires" value={formatDate(subscription.giftedExpiresAt)} />
              ) : (
                <>
                  <InfoField
                    label="Billing"
                    value={`${formatPrice(subscription.amountCents, subscription.currency)} / ${subscription.billingInterval}`}
                  />
                  <InfoField
                    label="Current Period End"
                    value={formatDate(subscription.currentPeriodEnd)}
                  />
                </>
              )}
              {subscription.cardBrand && (
                <InfoField
                  label="Payment Method"
                  value={`${subscription.cardBrand} •••• ${subscription.cardLastFour || ''}`}
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No active subscription (Free tier)</p>
          )}
        </div>
      </div>
    );
  };

  const renderPaymentsTab = () => {
    if (payments.length === 0) {
      return <EmptyState icon="CreditCardIcon" message="No payment history" />;
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">{paymentsTotal} total payment(s)</p>
        <div className="overflow-x-auto border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Product
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
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {payment.orderItemProductName || '-'}
                    {payment.orderItemVariantName && (
                      <span className="text-text-secondary"> · {payment.orderItemVariantName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-primary">
                    {formatPrice(payment.totalCents, payment.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.statusFormatted || payment.status || '')}`}
                    >
                      {payment.statusFormatted || payment.status || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {payment.receiptUrl ? (
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="View receipt"
                      >
                        <Icon name="DocumentTextIcon" size={18} />
                      </a>
                    ) : (
                      <span className="text-text-secondary">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paymentsHasMore && (
          <div className="flex justify-center pt-2">
            <LoadMoreButton isLoading={isLoadingMorePayments} onClick={handleLoadMorePayments} />
          </div>
        )}
      </div>
    );
  };

  const renderScoreboardsTab = () => {
    if (scoreboards.length === 0) {
      return <EmptyState icon="TrophyIcon" message="No scoreboards created" />;
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">{scoreboardsTotal} total scoreboard(s)</p>
        <div className="overflow-x-auto border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Visibility
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Entries
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {scoreboards.map((scoreboard) => (
                <tr key={scoreboard.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    <a
                      href={`/individual-scoreboard-view?id=${scoreboard.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                      title="Open scoreboard in new tab"
                    >
                      {scoreboard.title}
                      <Icon name="ArrowTopRightOnSquareIcon" size={14} />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        scoreboard.visibility === 'public'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {scoreboard.visibility}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{scoreboard.entryCount}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {formatDate(scoreboard.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {scoreboardsHasMore && (
          <div className="flex justify-center pt-2">
            <LoadMoreButton
              isLoading={isLoadingMoreScoreboards}
              onClick={handleLoadMoreScoreboards}
            />
          </div>
        )}
      </div>
    );
  };

  const renderActivityTab = () => {
    if (auditEntries.length === 0) {
      return <EmptyState icon="ClockIcon" message="No admin activity for this user" />;
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">{auditTotal} total action(s)</p>
        <div className="overflow-x-auto border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {auditEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary whitespace-nowrap">
                    {formatDateTime(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-primary">{entry.actionLabel}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {entry.admin?.email || 'System'}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary max-w-[200px] truncate">
                    {formatAuditDetails(entry.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {auditHasMore && (
          <div className="flex justify-center pt-2">
            <LoadMoreButton isLoading={isLoadingMoreAudit} onClick={handleLoadMoreAudit} />
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'payments':
        return renderPaymentsTab();
      case 'scoreboards':
        return renderScoreboardsTab();
      case 'activity':
        return renderActivityTab();
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface rounded-lg shadow-xl max-w-[800px] w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-text-primary truncate">
                  {user.fullName || user.email}
                </h2>
                {user.role === 'system_admin' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 flex-shrink-0">
                    Admin
                  </span>
                )}
                {user.subscription?.tier && (
                  <span className="flex-shrink-0">
                    <TierBadge tier={user.subscription.tier} />
                  </span>
                )}
              </div>
              {user.fullName && (
                <p className="text-sm text-text-secondary truncate">{user.email}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            title="Close modal"
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
              }`}
              title={tab.label}
            >
              <Icon name={tab.icon} size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="mt-4 text-sm text-text-secondary">Loading user details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <Icon
                name="ExclamationCircleIcon"
                size={20}
                className="text-red-600 flex-shrink-0 mt-0.5"
              />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper components
// ============================================================================

interface InfoFieldProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
}

function InfoField({ label, value, children }: InfoFieldProps) {
  return (
    <div>
      <dt className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</dt>
      <dd className="mt-1 text-sm text-text-primary">{children || value || '-'}</dd>
    </div>
  );
}

interface EmptyStateProps {
  icon: string;
  message: string;
}

function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Icon name={icon} size={48} className="text-muted-foreground" />
      <p className="mt-3 text-sm text-text-secondary">{message}</p>
    </div>
  );
}

interface LoadMoreButtonProps {
  isLoading: boolean;
  onClick: () => void;
}

function LoadMoreButton({ isLoading, onClick }: LoadMoreButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="px-4 py-2 text-sm font-medium text-primary hover:bg-red-600/10 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      title="Load more items"
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Loading...
        </span>
      ) : (
        'Load More'
      )}
    </button>
  );
}

/**
 * Format audit log details JSONB into a readable string
 */
function formatAuditDetails(details: Record<string, unknown>): string {
  if (!details || Object.keys(details).length === 0) return '-';

  const parts: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    if (value !== null && value !== undefined) {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      parts.push(`${formattedKey}: ${value}`);
    }
  }
  return parts.join(', ') || '-';
}
