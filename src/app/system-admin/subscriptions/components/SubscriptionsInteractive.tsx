'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks';
import { subscriptionService } from '@/services/subscriptionService';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Icon from '@/components/ui/AppIcon';
import TierBadge from '@/components/ui/TierBadge';
import LinkAccountModal from './LinkAccountModal';
import GiftTierModal from './GiftTierModal';
import CancelConfirmModal from './CancelConfirmModal';
import AuditLogPanel from './AuditLogPanel';
import PricingConfigSection from './PricingConfigSection';
import { AppreciationTier } from '@/types/models';

interface UserSubscription {
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

type FilterType = 'all' | 'active' | 'cancelled' | 'past_due' | 'appreciation' | 'free';

export default function SubscriptionsInteractive() {
  const { isAuthorized, isChecking } = useAuthGuard({ requiredRole: 'system_admin' });

  const [users, setUsers] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserSubscription | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showPricing, setShowPricing] = useState(true);
  const [auditLogRefreshKey, setAuditLogRefreshKey] = useState(0);

  // Success/error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [refetchingUserId, setRefetchingUserId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await subscriptionService.getAllSubscriptionsAdmin({
      search: debouncedSearch,
      filter,
      page,
      limit: 20,
    });

    if (fetchError) {
      setError(fetchError);
      setIsLoading(false);
      return;
    }

    if (data) {
      setUsers(data.users || []);
      setHasMore(data.pagination?.hasMore || false);
      setTotalCount(data.pagination?.total || 0);
    }

    setIsLoading(false);
  }, [debouncedSearch, filter, page]);

  useEffect(() => {
    if (isAuthorized) {
      void fetchUsers();
    }
  }, [isAuthorized, fetchUsers]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const refreshAuditLog = () => {
    setAuditLogRefreshKey((prev) => prev + 1);
  };

  const handleRefresh = () => {
    void fetchUsers();
  };

  const handleLinkSuccess = () => {
    setShowLinkModal(false);
    setSelectedUser(null);
    setSuccessMessage('Subscription linked successfully');
    refreshAuditLog();
    void fetchUsers();
  };

  const handleGiftSuccess = () => {
    setShowGiftModal(false);
    setSelectedUser(null);
    setSuccessMessage('Appreciation tier gifted successfully');
    refreshAuditLog();
    void fetchUsers();
  };

  const handleCancelSuccess = () => {
    setShowCancelModal(false);
    setSelectedUser(null);
    setSuccessMessage('Subscription cancelled successfully');
    refreshAuditLog();
    void fetchUsers();
  };

  const handleRemoveGiftSuccess = () => {
    setSuccessMessage('Appreciation tier removed successfully');
    refreshAuditLog();
    void fetchUsers();
  };

  const handleRefetchSubscription = async (userId: string) => {
    setRefetchingUserId(userId);
    setError(null);

    const { data, error: refetchError } =
      await subscriptionService.refetchSubscriptionAdmin(userId);

    if (refetchError) {
      setError(refetchError);
      setRefetchingUserId(null);
      return;
    }

    // Update just the affected user's subscription in local state
    // instead of reloading the entire table
    if (data?.subscription) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, subscription: data.subscription } : user
        )
      );
    }

    setSuccessMessage(data?.message || 'Subscription data refetched successfully');
    setRefetchingUserId(null);
    refreshAuditLog();
  };

  const getStatusBadge = (user: UserSubscription) => {
    const sub = user.subscription;
    if (!sub) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Free
        </span>
      );
    }

    if (sub.isGifted) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
          Gifted
        </span>
      );
    }

    const statusColors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      trialing: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
      past_due: 'bg-orange-100 text-orange-700',
      paused: 'bg-gray-100 text-gray-600',
      expired: 'bg-gray-100 text-gray-600',
      unpaid: 'bg-red-100 text-red-700',
    };

    const colorClass = statusColors[sub.status] || 'bg-gray-100 text-gray-600';

    return (
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
        >
          {sub.statusFormatted || sub.status}
        </span>
        {sub.paymentFailureCount > 0 && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700"
            title={`${sub.paymentFailureCount} payment failure(s)${sub.lastPaymentFailedAt ? ` — last: ${formatDate(sub.lastPaymentFailedAt)}` : ''}`}
          >
            {sub.paymentFailureCount}⚠
          </span>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(cents / 100);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={true} />

      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Manage Subscriptions</h1>
              <p className="text-text-secondary mt-1">
                View and manage user subscriptions, gift appreciation tiers, and fix account linking
                issues.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
              >
                <Icon name="ArrowLeftIcon" size={18} />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <Icon name="CheckCircleIcon" size={20} className="text-green-600" />
              <span className="text-green-700">{successMessage}</span>
            </div>
          )}

          {/* Filters and Search */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Icon
                  name="MagnifyingGlassIcon"
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                />
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as FilterType);
                  setPage(1);
                }}
                className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="all">All Users</option>
                <option value="active">Active Subscriptions</option>
                <option value="cancelled">Cancelled</option>
                <option value="past_due">Payment Issues</option>
                <option value="appreciation">Appreciation Tier</option>
                <option value="free">Free Users</option>
              </select>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                title="Refresh list"
              >
                <Icon name="ArrowPathIcon" size={18} />
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <Icon name="ExclamationCircleIcon" size={20} className="text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Billing
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Next Billing
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                          <span className="text-text-secondary">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-text-primary">
                              {user.fullName || 'No name'}
                            </div>
                            <div className="text-sm text-text-secondary">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(user)}</td>
                        <td className="px-4 py-3">
                          {user.subscription ? (
                            <TierBadge tier={user.subscription.tier} size="sm" />
                          ) : (
                            <span className="text-text-secondary">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {user.subscription && !user.subscription.isGifted ? (
                            <div className="text-sm">
                              <div>
                                {formatPrice(
                                  user.subscription.amountCents,
                                  user.subscription.currency
                                )}
                              </div>
                              <div className="text-text-secondary capitalize">
                                {user.subscription.billingInterval}
                              </div>
                            </div>
                          ) : (
                            <span className="text-text-secondary">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {user.subscription?.isGifted && user.subscription.giftedExpiresAt ? (
                            <div>
                              <div className="text-text-secondary">Expires:</div>
                              <div>{formatDate(user.subscription.giftedExpiresAt)}</div>
                            </div>
                          ) : user.subscription?.currentPeriodEnd ? (
                            formatDate(user.subscription.currentPeriodEnd)
                          ) : (
                            <span className="text-text-secondary">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Link subscription - always available */}
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowLinkModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Link LemonSqueezy subscription"
                            >
                              <Icon name="LinkIcon" size={18} />
                            </button>

                            {/* Refetch subscription from LemonSqueezy */}
                            {(() => {
                              const canRefetch =
                                !!user.subscription?.lemonsqueezySubscriptionId &&
                                !user.subscription?.isGifted;
                              const isRefetching = refetchingUserId === user.id;
                              return (
                                <button
                                  onClick={() => canRefetch && handleRefetchSubscription(user.id)}
                                  disabled={!canRefetch || isRefetching}
                                  className={`p-2 rounded-md transition-colors ${
                                    canRefetch
                                      ? 'text-blue-600 hover:bg-blue-50'
                                      : 'text-gray-400 cursor-not-allowed'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  title={
                                    canRefetch
                                      ? 'Refetch subscription data from LemonSqueezy'
                                      : 'No LemonSqueezy subscription to refetch'
                                  }
                                >
                                  <Icon
                                    name="ArrowPathIcon"
                                    size={18}
                                    className={isRefetching ? 'animate-spin' : ''}
                                  />
                                </button>
                              );
                            })()}

                            {/* Gift appreciation tier */}
                            {(() => {
                              const canGift =
                                (!user.subscription ||
                                  (user.subscription.status !== 'active' &&
                                    user.subscription.status !== 'trialing')) &&
                                !user.subscription?.isGifted;
                              return (
                                <button
                                  onClick={() => {
                                    if (canGift) {
                                      setSelectedUser(user);
                                      setShowGiftModal(true);
                                    }
                                  }}
                                  disabled={!canGift}
                                  className={`p-2 rounded-md transition-colors ${
                                    canGift
                                      ? 'text-purple-600 hover:bg-purple-50'
                                      : 'text-gray-400 cursor-not-allowed'
                                  }`}
                                  title={
                                    canGift
                                      ? 'Gift appreciation tier'
                                      : user.subscription?.isGifted
                                        ? 'User already has a gifted tier'
                                        : 'User has an active subscription'
                                  }
                                >
                                  <Icon name="GiftIcon" size={18} />
                                </button>
                              );
                            })()}

                            {/* Remove gift */}
                            {(() => {
                              const canRemoveGift = !!user.subscription?.isGifted;
                              return (
                                <button
                                  onClick={async () => {
                                    if (!canRemoveGift) return;
                                    if (
                                      confirm(
                                        'Are you sure you want to remove the appreciation tier from this user?'
                                      )
                                    ) {
                                      const { error } =
                                        await subscriptionService.removeAppreciationTierAdmin(
                                          user.id
                                        );
                                      if (error) {
                                        setError(error);
                                      } else {
                                        handleRemoveGiftSuccess();
                                      }
                                    }
                                  }}
                                  disabled={!canRemoveGift}
                                  className={`p-2 rounded-md transition-colors ${
                                    canRemoveGift
                                      ? 'text-red-600 hover:bg-red-50'
                                      : 'text-gray-400 cursor-not-allowed'
                                  }`}
                                  title={
                                    canRemoveGift
                                      ? 'Remove appreciation tier'
                                      : 'No gifted tier to remove'
                                  }
                                >
                                  <Icon name="XCircleIcon" size={18} />
                                </button>
                              );
                            })()}

                            {/* Cancel subscription */}
                            {(() => {
                              const canCancel =
                                !!user.subscription?.lemonsqueezySubscriptionId &&
                                user.subscription.status === 'active' &&
                                !user.subscription.isGifted;
                              return (
                                <button
                                  onClick={() => {
                                    if (canCancel) {
                                      setSelectedUser(user);
                                      setShowCancelModal(true);
                                    }
                                  }}
                                  disabled={!canCancel}
                                  className={`p-2 rounded-md transition-colors ${
                                    canCancel
                                      ? 'text-red-600 hover:bg-red-50'
                                      : 'text-gray-400 cursor-not-allowed'
                                  }`}
                                  title={
                                    canCancel
                                      ? 'Cancel subscription'
                                      : 'No active subscription to cancel'
                                  }
                                >
                                  <Icon name="NoSymbolIcon" size={18} />
                                </button>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalCount > 0 && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, totalCount)} of {totalCount}{' '}
                  users
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore}
                    className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Configuration Panel */}
          <div className="mt-6">
            <PricingConfigSection
              isOpen={showPricing}
              onToggle={() => setShowPricing(!showPricing)}
            />
          </div>

          {/* Audit Log Panel */}
          <div className="mt-6">
            <AuditLogPanel
              isOpen={showAuditLog}
              onToggle={() => setShowAuditLog(!showAuditLog)}
              refreshKey={auditLogRefreshKey}
            />
          </div>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      {showLinkModal && selectedUser && (
        <LinkAccountModal
          user={selectedUser}
          onClose={() => {
            setShowLinkModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleLinkSuccess}
        />
      )}

      {showGiftModal && selectedUser && (
        <GiftTierModal
          user={selectedUser}
          onClose={() => {
            setShowGiftModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleGiftSuccess}
        />
      )}

      {showCancelModal && selectedUser && (
        <CancelConfirmModal
          user={selectedUser}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}
