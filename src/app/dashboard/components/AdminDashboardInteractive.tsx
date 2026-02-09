'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import { scoreboardService } from '../../../services/scoreboardService';
import { subscriptionService } from '../../../services/subscriptionService';
import { useInfiniteScroll, useUndoQueue } from '../../../hooks';
import { Scoreboard as ScoreboardModel, ScoreType, TimeFormat } from '../../../types/models';
import { limitsService } from '@/services/limitsService';
import Header from '@/components/common/Header';
import UndoToast from '@/components/common/UndoToast';
import UsageCounterBlock from '@/components/common/UsageCounterBlock';
import ScoreboardCard from './ScoreboardCard';
import CreateScoreboardModal from './CreateScoreboardModal';
import InviteUserModal from './InviteUserModal';
import ToastNotification from './ToastNotification';
import EmptyState from './EmptyState';
import StatsCard from './StatsCard';
import Icon from '@/components/ui/AppIcon';
import SearchableSelect from '@/components/ui/SearchableSelect';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}

interface Owner {
  id: string;
  email: string;
  fullName: string | null;
}

const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 300;

const AdminDashboardInteractive = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    userProfile,
    signOut,
    isSystemAdmin,
    subscriptionTier,
    subscriptionStatus,
    subscriptionEndDate,
    refreshSubscription,
  } = useAuth();
  const { isAuthorized, isChecking } = useAuthGuard();
  const { toasts, addUndoAction, executeUndo, removeToast } = useUndoQueue();
  const [scoreboards, setScoreboards] = useState<ScoreboardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [_error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', isVisible: false });
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'entries'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [allOwners, setAllOwners] = useState<Owner[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [publicUsage, setPublicUsage] = useState<{
    used: number;
    max: number;
    remaining: number;
  } | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingDeletesRef = useRef<
    Map<string, { scoreboard: ScoreboardModel; timerId: NodeJS.Timeout }>
  >(new Map());
  const hasLoadedRef = useRef(false);
  const subscriptionRefreshAttemptedRef = useRef(false);

  // Cache isSystemAdmin result to avoid function reference changes
  const isAdmin = isSystemAdmin();

  // Check if subscription is cancelled but still within grace period (before ends_at)
  // subscriptionEndDate comes from cancelledAt for cancelled subs (LemonSqueezy's ends_at)
  const isCancelledButActive =
    subscriptionStatus === 'cancelled' &&
    subscriptionEndDate &&
    new Date(subscriptionEndDate) > new Date();

  // Format date helper for cancelled subscription message
  const formatBenefitEndDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Refresh subscription tier after successful checkout
  // Uses retry logic since webhook processing may take a moment
  useEffect(() => {
    const isSubscriptionSuccess = searchParams.get('subscription') === 'success';

    if (isSubscriptionSuccess && user && !subscriptionRefreshAttemptedRef.current) {
      subscriptionRefreshAttemptedRef.current = true;

      // Clear the URL param
      router.replace('/dashboard');

      // Show success toast
      setToast({
        message: 'Welcome! Your subscription is being activated...',
        type: 'success',
        isVisible: true,
      });

      // Refresh subscription with retry logic (webhook may take a moment)
      const refreshWithRetry = async (attempts = 0) => {
        await refreshSubscription();

        // If still no tier after refresh and we haven't exceeded retries, try again
        if (attempts < 3) {
          setTimeout(() => refreshWithRetry(attempts + 1), 2000);
        }
      };

      // Start refresh after a short delay to allow webhook processing
      setTimeout(() => refreshWithRetry(), 1000);
    }
  }, [searchParams, user, router, refreshSubscription]);

  // Execute all pending deletes on unmount (Option A: execute on navigation)
  useEffect(() => {
    const pendingDeletes = pendingDeletesRef.current;
    return () => {
      pendingDeletes.forEach(async ({ scoreboard, timerId }) => {
        clearTimeout(timerId);
        try {
          await scoreboardService.deleteScoreboard(scoreboard.id);
        } catch {
          // Silent failure on unmount
        }
      });
      pendingDeletes.clear();
    };
  }, []);

  // Load owners for system admin dropdown
  useEffect(() => {
    if (isAuthorized && user && userProfile && isAdmin) {
      loadOwners();
    }
  }, [isAuthorized, user, userProfile, isAdmin]);

  const loadOwners = async () => {
    setLoadingOwners(true);
    try {
      const { data, error } = await scoreboardService.getAllScoreboardOwners();
      if (!error && data) {
        setAllOwners(data);
      }
    } catch (_error) {
      setError('Failed to load owners. Please try again.');
    } finally {
      setLoadingOwners(false);
    }
  };

  const loadPublicUsage = useCallback(async () => {
    if (!user?.id) return;

    if (subscriptionTier) {
      setPublicUsage(null);
      return;
    }

    const { data: remaining, error } = await limitsService.getRemainingPublicScoreboards(user.id);
    if (error || remaining === null || remaining === undefined) {
      setPublicUsage(null);
      return;
    }

    const max = limitsService.getLimitsForUser(false).maxPublicScoreboards;
    const remainingValue = Number.isFinite(remaining) ? Number(remaining) : max;
    const used = Math.max(max - remainingValue, 0);

    setPublicUsage({ used, max, remaining: remainingValue });
  }, [user?.id, subscriptionTier]);

  useEffect(() => {
    loadPublicUsage();
  }, [loadPublicUsage, scoreboards.length]);

  // Load scoreboards function - uses isAdmin and user from closure
  const loadScoreboards = useCallback(
    async (
      isInitial: boolean,
      searchTerm: string,
      ownerFilter: string,
      currentOffset: number,
      currentSortBy: 'name' | 'date' | 'entries',
      currentSortOrder: 'asc' | 'desc'
    ) => {
      if (isInitial) {
        setLoading(true);
        setScoreboards([]);
      } else {
        setLoadingMore(true);
      }
      setError('');

      try {
        let result;

        if (isAdmin) {
          result = await scoreboardService.getAllScoreboardsPaginated({
            limit: PAGE_SIZE,
            offset: currentOffset,
            search: searchTerm || undefined,
            ownerId: ownerFilter !== 'all' ? ownerFilter : undefined,
            sortBy: currentSortBy,
            sortOrder: currentSortOrder,
          });
        } else {
          result = await scoreboardService.getUserScoreboardsPaginated(user!.id, {
            limit: PAGE_SIZE,
            offset: currentOffset,
            search: searchTerm || undefined,
            sortBy: currentSortBy,
            sortOrder: currentSortOrder,
          });
        }

        if (result.error) {
          setError(result.error.message);
        } else {
          if (isInitial) {
            setScoreboards(result.data || []);
            setOffset(result.data?.length || 0);
          } else {
            setScoreboards((prev) => [...prev, ...(result.data || [])]);
            setOffset(currentOffset + (result.data?.length || 0));
          }
          setHasMore(result.hasMore);
          setTotalCount(result.totalCount);
        }
      } catch (_err) {
        setError('Failed to load scoreboards');
      } finally {
        if (isInitial) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [user, isAdmin]
  );

  // Debounce search query - same pattern as PublicScoreboardInteractive
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Effect for data fetching - ONLY depends on search and owner filter
  // Sort is always done client-side, never triggers a reload
  // Wait for userProfile to be loaded before fetching to ensure isAdmin is correct
  // Only load on initial mount OR when search/filter changes to prevent tab-switch reloads
  useEffect(() => {
    if (isAuthorized && user && userProfile) {
      // Skip if already loaded and no search/filter change
      if (hasLoadedRef.current && debouncedSearch === '' && selectedOwnerId === 'all') {
        return;
      }
      hasLoadedRef.current = true;
      // Always fetch with default sort (date desc), sorting is done client-side
      loadScoreboards(true, debouncedSearch, selectedOwnerId, 0, 'date', 'desc');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, user, userProfile, debouncedSearch, selectedOwnerId]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      // Always fetch with default sort (date desc), sorting is done client-side
      loadScoreboards(false, debouncedSearch, selectedOwnerId, offset, 'date', 'desc');
    }
  }, [loadingMore, hasMore, offset, debouncedSearch, selectedOwnerId, loadScoreboards]);

  const { loadMoreRef } = useInfiniteScroll({
    hasMore,
    isLoading: loadingMore,
    onLoadMore: handleLoadMore,
  });

  const handleCreateScoreboard = async (
    title: string,
    description: string,
    visibility: 'public' | 'private',
    scoreType: ScoreType,
    scoreSortOrder: 'asc' | 'desc',
    timeFormat: TimeFormat | null
  ) => {
    try {
      const { data, error } = await scoreboardService.createScoreboard({
        ownerId: user!.id,
        title,
        description,
        sortOrder: scoreSortOrder,
        visibility,
        scoreType,
        timeFormat,
        isLocked: false,
      });

      if (error) {
        throw error;
      }

      await loadScoreboards(true, debouncedSearch, selectedOwnerId, 0, 'date', 'desc');
      await loadPublicUsage();
      return { success: true, message: 'Scoreboard created successfully', scoreboardId: data?.id };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to create scoreboard',
      };
    }
  };

  const _handleDeleteScoreboard = async (id: string) => {
    try {
      const { error } = await scoreboardService.deleteScoreboard(id);
      if (error) throw error;

      await loadScoreboards(true, debouncedSearch, selectedOwnerId, 0, 'date', 'desc');
      return { success: true };
    } catch (_err) {
      return { success: false };
    }
  };

  const handleUnlockScoreboard = async (scoreboardId: string) => {
    try {
      const { data, error } = await scoreboardService.unlockScoreboard(scoreboardId);
      if (error || !data) {
        throw error || new Error('Unable to unlock scoreboard');
      }

      await loadScoreboards(true, debouncedSearch, selectedOwnerId, 0, 'date', 'desc');
      await loadPublicUsage();
      setToast({ message: 'Scoreboard unlocked', type: 'success', isVisible: true });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Unable to unlock scoreboard',
        type: 'error',
        isVisible: true,
      });
    }
  };

  const handleSignOut = async () => {
    router.push('/');
    await signOut();
  };

  const handleResumeSubscription = async () => {
    // Need to get the subscription ID first
    if (!user?.id || isReactivating) return;

    setIsReactivating(true);

    // Get the subscription to find the LemonSqueezy subscription ID
    const { data: subscription, error: subError } = await subscriptionService.getSubscription(
      user.id
    );

    if (subError || !subscription?.lemonsqueezySubscriptionId) {
      setToast({
        message: 'Unable to find subscription. Please try from the Supporter page.',
        type: 'error',
        isVisible: true,
      });
      setIsReactivating(false);
      return;
    }

    const { data, error: resumeError } = await subscriptionService.resumeSubscription(
      subscription.lemonsqueezySubscriptionId
    );

    if (resumeError || !data) {
      setToast({
        message: resumeError || 'Unable to resume subscription.',
        type: 'error',
        isVisible: true,
      });
      setIsReactivating(false);
      return;
    }

    // Success
    setToast({
      message: 'Your subscription has been reactivated!',
      type: 'success',
      isVisible: true,
    });

    // Refresh subscription data
    if (refreshSubscription) {
      refreshSubscription();
    }

    setIsReactivating(false);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const handleNavigateToScoreboard = (id: string) => {
    router.push(`/scoreboard-management?id=${id}`);
  };

  const totalEntries = scoreboards.reduce(
    (sum, scoreboard) => sum + (scoreboard.entryCount || 0),
    0
  );
  const avgEntriesPerScoreboard =
    scoreboards.length > 0 ? Math.round(totalEntries / scoreboards.length) : 0;

  // Client-side sorting for all sort types
  const sortedScoreboards = useMemo(() => {
    const sorted = [...scoreboards];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'date':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case 'entries':
          comparison = (a.entryCount || 0) - (b.entryCount || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [scoreboards, sortBy, sortOrder]);

  const handleRenameScoreboard = async (id: string, newTitle: string) => {
    try {
      const { error } = await scoreboardService.updateScoreboard(id, { title: newTitle });
      if (error) throw error;

      await loadScoreboards(true, debouncedSearch, selectedOwnerId, 0, 'date', 'desc');
      showToast('Scoreboard renamed successfully', 'success');
    } catch (_err) {
      showToast('Failed to rename scoreboard', 'error');
    }
  };

  const handleDeleteScoreboard = (scoreboard: ScoreboardModel) => {
    const deleteId = `delete-${scoreboard.id}`;

    // Optimistically remove from UI
    setScoreboards((prev) => prev.filter((s) => s.id !== scoreboard.id));
    setTotalCount((prev) => prev - 1);

    // Set up delayed API delete (5 seconds)
    const timerId = setTimeout(async () => {
      pendingDeletesRef.current.delete(deleteId);
      try {
        const { error } = await scoreboardService.deleteScoreboard(scoreboard.id);
        if (error) {
          // Restore on error
          setScoreboards((prev) => [...prev, scoreboard]);
          setTotalCount((prev) => prev + 1);
          showToast('Failed to delete scoreboard', 'error');
        }
      } catch {
        // Restore on error
        setScoreboards((prev) => [...prev, scoreboard]);
        setTotalCount((prev) => prev + 1);
        showToast('Failed to delete scoreboard', 'error');
      }
    }, 5000);

    // Track pending delete
    pendingDeletesRef.current.set(deleteId, { scoreboard, timerId });

    // Add undo action
    addUndoAction({
      id: deleteId,
      message: `Deleted "${scoreboard.title}"`,
      timestamp: Date.now(),
      undo: async () => {
        // Cancel the pending delete
        const pending = pendingDeletesRef.current.get(deleteId);
        if (pending) {
          clearTimeout(pending.timerId);
          pendingDeletesRef.current.delete(deleteId);
        }
        // Restore to UI
        setScoreboards((prev) => [...prev, scoreboard]);
        setTotalCount((prev) => prev + 1);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={!!user} onLogout={handleSignOut} />

      <main className="pt-20 landscape-mobile:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 landscape-mobile:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {isAdmin ? 'System Admin Dashboard' : 'My Scoreboards'}
              </h1>
              <p className="text-text-secondary">
                {isAdmin
                  ? 'Oversee all scoreboards and manage system-wide content'
                  : 'Manage your scoreboards and competition entries'}
              </p>
            </div>

            {/* Cancelled subscription warning banner */}
            {!isAdmin && isCancelledButActive && (
              <div className="mt-4 sm:mt-0 sm:ml-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg max-w-md">
                <div className="flex items-start gap-2">
                  <Icon
                    name="ExclamationTriangleIcon"
                    size={18}
                    className="text-warning flex-shrink-0 mt-0.5"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Subscription Cancelled</p>
                    <p className="text-text-secondary mt-0.5">
                      Benefits active until{' '}
                      <strong className="text-text-primary">
                        {formatBenefitEndDate(subscriptionEndDate)}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              {isAdmin && (
                <>
                  <Link
                    href="/system-admin/invitations"
                    className="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-muted rounded-md transition-smooth"
                  >
                    <Icon name="EnvelopeIcon" size={20} />
                    <span>Invitations</span>
                  </Link>
                  <Link
                    href="/system-admin/subscriptions"
                    className="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-muted rounded-md transition-smooth"
                  >
                    <Icon name="CreditCardIcon" size={20} />
                    <span>Subscriptions</span>
                  </Link>
                  <button
                    onClick={() => router.push('/system-admin/settings')}
                    className="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-muted rounded-md transition-smooth"
                    title="System settings"
                  >
                    <Icon name="Cog6ToothIcon" size={20} />
                    <span>Settings</span>
                  </button>
                </>
              )}
              {!isAdmin && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsInviteModalOpen(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-muted rounded-md transition-smooth"
                    title="Invite Users"
                  >
                    <Icon name="UserPlusIcon" size={20} />
                    <span className="hidden sm:inline">Invite</span>
                  </button>
                  {(!subscriptionTier || subscriptionTier === 'appreciation') &&
                    !isCancelledButActive && (
                      <Link
                        href="/supporter-plan"
                        className="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-muted rounded-md transition-smooth"
                        title="Support Scoreboard Manager and unlock more features"
                      >
                        <Icon name="HeartIcon" size={20} />
                        <span className="hidden sm:inline">Become a Supporter</span>
                      </Link>
                    )}
                  {isCancelledButActive && (
                    <button
                      onClick={handleResumeSubscription}
                      disabled={isReactivating}
                      className="flex items-center space-x-2 px-4 py-2 text-warning hover:text-yellow-600 hover:bg-yellow-500/10 rounded-md transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reactivate your supporter subscription"
                    >
                      <Icon
                        name="ArrowPathIcon"
                        size={20}
                        className={isReactivating ? 'animate-spin' : ''}
                      />
                      <span className="hidden sm:inline">
                        {isReactivating ? 'Reactivating...' : 'Reactivate'}
                      </span>
                    </button>
                  )}
                </>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth hover-lift"
                title="Create a new scoreboard"
              >
                <Icon name="PlusIcon" size={20} />
                <span>Create New Scoreboard</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Total Scoreboards"
              value={totalCount || scoreboards.length}
              icon="ClipboardDocumentListIcon"
              description={`${scoreboards.length} loaded of ${totalCount}`}
            />
            <StatsCard
              title="Total Entries"
              value={totalEntries}
              icon="UsersIcon"
              description="Across loaded scoreboards"
            />
            <StatsCard
              title="Avg. Entries/Board"
              value={avgEntriesPerScoreboard}
              icon="ChartBarIcon"
              description="Average participation rate"
            />
          </div>

          {!subscriptionTier && publicUsage && (
            <div className="mb-6">
              <UsageCounterBlock
                label="public scoreboards"
                used={publicUsage.used}
                max={publicUsage.max}
                ctaHref="/supporter-plan"
                ctaLabel="Become a Supporter to unlock more"
              />
            </div>
          )}

          {loading || isChecking ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading scoreboards...</p>
            </div>
          ) : scoreboards.length > 0 ? (
            <>
              <div className="bg-card border border-border rounded-lg p-4 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="relative w-full lg:w-96">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Icon
                        name="MagnifyingGlassIcon"
                        size={20}
                        className="text-muted-foreground"
                      />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search scoreboards by title or description..."
                      className="w-full pl-10 pr-10 py-2 border border-input rounded-md bg-surface text-text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-smooth duration-150"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-text-primary transition-smooth duration-150"
                        aria-label="Clear search"
                        title="Clear search"
                      >
                        <Icon name="XMarkIcon" size={20} />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {isAdmin && (
                      <div className="flex items-center space-x-2">
                        <label
                          htmlFor="ownerFilter"
                          className="text-sm font-medium text-text-secondary"
                        >
                          Owner:
                        </label>
                        <SearchableSelect
                          id="ownerFilter"
                          ariaLabel="Filter scoreboards by owner"
                          options={[
                            { value: 'all', label: `All Owners (${allOwners.length})` },
                            ...allOwners.map((owner) => ({
                              value: owner.id,
                              label: owner.fullName || owner.email,
                            })),
                          ]}
                          value={selectedOwnerId}
                          onChange={setSelectedOwnerId}
                          placeholder={loadingOwners ? 'Loading owners...' : 'Filter by owner...'}
                          emptyMessage="No owners found"
                          className="min-w-[140px] sm:min-w-[180px] md:min-w-[220px]"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <label htmlFor="sortBy" className="text-sm font-medium text-text-secondary">
                        Sort by:
                      </label>
                      <select
                        id="sortBy"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'entries')}
                        className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="date">Date Created</option>
                        <option value="name">Name</option>
                        <option value="entries">Entry Count</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-2 border border-input rounded-md hover:bg-muted transition-smooth"
                      aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                      title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                    >
                      <Icon
                        name={sortOrder === 'asc' ? 'ArrowUpIcon' : 'ArrowDownIcon'}
                        size={20}
                        className="text-text-secondary"
                      />
                    </button>
                  </div>
                </div>
              </div>

              {sortedScoreboards.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedScoreboards.map((scoreboard) => (
                      <ScoreboardCard
                        key={scoreboard.id}
                        id={scoreboard.id}
                        title={scoreboard.title}
                        description={scoreboard.description || ''}
                        entryCount={scoreboard.entryCount || 0}
                        createdAt={new Date(scoreboard.createdAt).toLocaleDateString()}
                        ownerName={isAdmin ? scoreboard.owner?.fullName : undefined}
                        visibility={scoreboard.visibility}
                        isLocked={!subscriptionTier && scoreboard.isLocked}
                        canUnlock={
                          !subscriptionTier &&
                          scoreboard.visibility === 'public' &&
                          scoreboard.isLocked &&
                          (publicUsage?.remaining || 0) > 0
                        }
                        onUnlock={() => handleUnlockScoreboard(scoreboard.id)}
                        onRename={handleRenameScoreboard}
                        onDelete={() => handleDeleteScoreboard(scoreboard)}
                        onNavigate={handleNavigateToScoreboard}
                      />
                    ))}
                  </div>

                  {/* Infinite scroll trigger */}
                  <div ref={loadMoreRef} className="py-8 flex justify-center">
                    {loadingMore && (
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="text-muted-foreground">Loading more...</span>
                      </div>
                    )}
                    {!hasMore && scoreboards.length > 0 && (
                      <span className="text-muted-foreground text-sm">
                        All {totalCount} scoreboards loaded
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <Icon
                    name="MagnifyingGlassIcon"
                    size={48}
                    className="text-muted-foreground mx-auto mb-4"
                  />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">No Results Found</h3>
                  <p className="text-sm text-text-secondary">Try adjusting your search criteria</p>
                </div>
              )}
            </>
          ) : (
            <EmptyState onCreateNew={() => setIsCreateModalOpen(true)} />
          )}
        </div>
      </main>

      <CreateScoreboardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateScoreboard}
        isSupporter={Boolean(subscriptionTier)}
        publicUsage={publicUsage}
      />

      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      {/* Undo toasts for delete operations */}
      {toasts.map((undoToast, index) => (
        <UndoToast
          key={undoToast.id}
          toast={undoToast}
          onUndo={() => executeUndo(undoToast.id)}
          onDismiss={() => removeToast(undoToast.id)}
          index={index}
        />
      ))}

      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          setToast({ message: 'Invitation sent successfully!', type: 'success', isVisible: true });
        }}
      />
    </div>
  );
};

export default AdminDashboardInteractive;
