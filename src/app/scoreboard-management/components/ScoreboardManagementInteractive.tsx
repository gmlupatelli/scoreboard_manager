'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useTimeoutRef, useUndoQueue } from '@/hooks';
import { scoreboardService } from '../../../services/scoreboardService';
import { limitsService } from '@/services/limitsService';
import { downloadScoreboardCSV } from '@/utils/downloadExport';
import {
  Scoreboard,
  ScoreboardEntry,
  ScoreboardCustomStyles,
  ScoreType,
  TimeFormat,
} from '../../../types/models';
import SearchInterface from '@/components/common/SearchInterface';
import Icon from '@/components/ui/AppIcon';
import UndoToast from '@/components/common/UndoToast';
import UsageCounterBlock from '@/components/common/UsageCounterBlock';
import EntryRow from './EntryRow';
import EntryCard from './EntryCard';
import AddEntryModal from './AddEntryModal';
import ImportCSVModal from './ImportCSVModal';
import ConfirmationModal from './ConfirmationModal';
import Toast from './Toast';
import EditScoreboardModal from './EditScoreboardModal';
import StyleCustomizationSection from './StyleCustomizationSection';
import EmbedCodeSection from './EmbedCodeSection';
import KioskSettingsSection from './KioskSettingsSection';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}

const ScoreboardManagementInteractive = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scoreboardId = searchParams.get('id');
  const { user, userProfile, loading: authLoading, subscriptionTier } = useAuth();
  const isFreeUser = !subscriptionTier;
  const { set: setTimeoutSafe, isMounted } = useTimeoutRef();
  const { toasts, addUndoAction, executeUndo, removeToast } = useUndoQueue();
  const pendingDeletesRef = useRef<
    Map<string, { entry: ScoreboardEntry; timerId: NodeJS.Timeout }>
  >(new Map());
  const hasLoadedRef = useRef(false);

  const [isHydrated, setIsHydrated] = useState(false);
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [entries, setEntries] = useState<ScoreboardEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<ScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'score'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditScoreboardModalOpen, setIsEditScoreboardModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isProcessing?: boolean;
    processingText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isProcessing: false,
    processingText: '',
  });
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    isVisible: false,
  });
  const [isSavingStyles, setIsSavingStyles] = useState(false);
  const [isStyleSectionExpanded, setIsStyleSectionExpanded] = useState(false);
  const [isEmbedSectionExpanded, setIsEmbedSectionExpanded] = useState(false);
  const [isKioskSectionExpanded, setIsKioskSectionExpanded] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [publicUnlockRemaining, setPublicUnlockRemaining] = useState<number | null>(null);

  // Execute all pending deletes on unmount (Option A: execute on navigation)
  useEffect(() => {
    const pendingDeletes = pendingDeletesRef.current;
    return () => {
      pendingDeletes.forEach(async ({ entry, timerId }) => {
        clearTimeout(timerId);
        try {
          if (scoreboardId) {
            await scoreboardService.deleteEntry(scoreboardId, entry.id);
          }
        } catch {
          // Silent failure on unmount
        }
      });
      pendingDeletes.clear();
    };
  }, [scoreboardId]);

  // Redirect if not authenticated or no scoreboard ID
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (!scoreboardId) {
        showToast('No scoreboard selected. Redirecting to dashboard...', 'error');
        setTimeoutSafe(() => router.push('/dashboard'), 2000, 'redirect-no-id');
        return;
      }
    }
  }, [user, authLoading, scoreboardId, router, setTimeoutSafe]);

  const loadPublicUnlockRemaining = useCallback(async () => {
    if (!user?.id || !isFreeUser) {
      setPublicUnlockRemaining(null);
      return;
    }

    const { data: remaining, error } = await limitsService.getRemainingPublicScoreboards(user.id);
    if (error || remaining === null || remaining === undefined) {
      setPublicUnlockRemaining(null);
      return;
    }

    const remainingValue = Number.isFinite(remaining) ? Number(remaining) : null;
    setPublicUnlockRemaining(remainingValue);
  }, [user?.id, isFreeUser]);

  useEffect(() => {
    loadPublicUnlockRemaining();
  }, [loadPublicUnlockRemaining, scoreboard?.isLocked, entries.length]);

  const recalculateRanks = useCallback(
    (entriesList: ScoreboardEntry[]): ScoreboardEntry[] => {
      const scoreboardSortOrder = scoreboard?.sortOrder || 'desc';
      const sorted = [...entriesList].sort((a, b) => {
        if (a.score !== b.score) {
          return scoreboardSortOrder === 'desc' ? b.score - a.score : a.score - b.score;
        }
        return a.name.localeCompare(b.name);
      });

      return sorted.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
    },
    [scoreboard?.sortOrder]
  );

  const updateEntriesState = useCallback(
    (updater: (prevEntries: ScoreboardEntry[]) => ScoreboardEntry[]) => {
      setEntries((prevEntries) => recalculateRanks(updater(prevEntries)));
    },
    [recalculateRanks]
  );

  const loadScoreboardData = useCallback(async () => {
    if (!scoreboardId) return;

    setLoading(true);
    setError('');

    try {
      // Load scoreboard details - FIXED: Use getScoreboard instead of getScoreboardById
      const scoreboardResult = await scoreboardService.getScoreboard(scoreboardId);

      if (scoreboardResult.error) {
        throw new Error(scoreboardResult.error.message || 'Failed to load scoreboard');
      }

      if (!scoreboardResult.data) {
        throw new Error('Scoreboard not found');
      }

      // Check if user has access to this scoreboard (owner or system admin)
      if (scoreboardResult.data.ownerId !== user?.id && userProfile?.role !== 'system_admin') {
        throw new Error('You do not have permission to manage this scoreboard');
      }

      setScoreboard(scoreboardResult.data);

      // Load entries for this scoreboard
      const entriesResult = await scoreboardService.getScoreboardEntries(scoreboardId);

      if (entriesResult.error) {
        throw new Error(entriesResult.error.message || 'Failed to load entries');
      }

      // Calculate ranks for all entries
      const entriesWithRanks = recalculateRanks(entriesResult.data || []);
      setEntries(entriesWithRanks);
      setFilteredEntries(entriesWithRanks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load scoreboard data';
      if (isMounted()) {
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }

      // Redirect to dashboard after showing error
      setTimeoutSafe(() => router.push('/dashboard'), 3000, 'redirect-error');
    } finally {
      if (isMounted()) {
        setLoading(false);
        setIsHydrated(true);
      }
    }
  }, [
    scoreboardId,
    user?.id,
    userProfile?.role,
    router,
    recalculateRanks,
    setTimeoutSafe,
    isMounted,
  ]);

  // Reset load ref when scoreboard ID changes (navigating to different scoreboard)
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [scoreboardId]);

  // Load scoreboard and entries (wait for userProfile to be loaded for role check)
  // Only load once on mount to prevent reloading when switching tabs
  useEffect(() => {
    if (user && userProfile && scoreboardId && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadScoreboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userProfile, scoreboardId]);

  useEffect(() => {
    let filtered = entries.filter((entry) =>
      entry.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'rank') {
        comparison = (a.rank || 0) - (b.rank || 0);
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'score') {
        comparison = a.score - b.score;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Recalculate ranks after filtering and sorting
    const filteredWithRanks = recalculateRanks(filtered);
    setFilteredEntries(filteredWithRanks);
    setCurrentPage(1);
  }, [searchQuery, entries, sortBy, sortOrder, scoreboard?.sortOrder, recalculateRanks]);

  const entryLimit = 50;
  const entryUsage = entries.length;
  const isReadOnly =
    isFreeUser && (Boolean(scoreboard?.isLocked) || scoreboard?.visibility === 'private');
  const isEntryLimitReached = isFreeUser && entryUsage >= entryLimit;
  const isEntryApproachingLimit = isFreeUser && entryUsage >= 45 && entryUsage < entryLimit;
  const canUnlockScoreboard =
    isFreeUser &&
    scoreboard?.visibility === 'public' &&
    Boolean(scoreboard?.isLocked) &&
    (publicUnlockRemaining || 0) > 0;

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const handleEditScoreboard = async (
    title: string,
    description: string,
    visibility: 'public' | 'private',
    scoreType: ScoreType,
    sortOrder: 'asc' | 'desc',
    timeFormat: TimeFormat | null,
    scoreTypeChanged: boolean
  ) => {
    if (!scoreboard) return;

    if (isReadOnly) {
      showToast('This scoreboard is read-only on the Free plan.', 'info');
      return;
    }

    try {
      if (scoreTypeChanged && entries.length > 0) {
        const deleteResult = await scoreboardService.deleteAllEntries(scoreboard.id);
        if (deleteResult.error) throw deleteResult.error;
      }

      const { error } = await scoreboardService.updateScoreboard(scoreboard.id, {
        title,
        description,
        visibility,
        scoreType,
        sortOrder,
        timeFormat,
      });

      if (error) throw error;

      await loadScoreboardData();
      showToast(
        scoreTypeChanged && entries.length > 0
          ? 'Scoreboard updated and entries cleared'
          : 'Scoreboard details updated successfully',
        'success'
      );
    } catch {
      showToast('Failed to update scoreboard details', 'error');
    }
  };

  const handleUnlockScoreboard = async () => {
    if (!scoreboard || isUnlocking) return;

    setIsUnlocking(true);
    try {
      const { data, error } = await scoreboardService.unlockScoreboard(scoreboard.id);
      if (error || !data) {
        throw error || new Error('Unable to unlock scoreboard');
      }

      await loadScoreboardData();
      showToast('Scoreboard unlocked', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to unlock scoreboard', 'error');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleSaveStyles = async (
    styles: ScoreboardCustomStyles,
    scope: 'main' | 'embed' | 'both'
  ) => {
    if (!scoreboard) return;

    if (isReadOnly) {
      showToast('This scoreboard is read-only on the Free plan.', 'info');
      return;
    }

    setIsSavingStyles(true);
    try {
      const { error } = await scoreboardService.updateScoreboard(scoreboard.id, {
        customStyles: styles,
        styleScope: scope,
      });

      if (error) throw error;

      await loadScoreboardData();
      showToast('Style settings saved successfully', 'success');
    } catch {
      showToast('Failed to save style settings', 'error');
    } finally {
      setIsSavingStyles(false);
    }
  };

  const handleAddEntry = async (name: string, score: number) => {
    if (!scoreboard) return;

    if (isReadOnly) {
      showToast('This scoreboard is read-only on the Free plan.', 'info');
      return;
    }

    if (isEntryLimitReached) {
      showToast("You've reached the maximum of 50 entries on the free plan.", 'error');
      return;
    }

    try {
      // FIXED: Use createEntry instead of addEntry
      const result = await scoreboardService.createEntry({
        scoreboardId: scoreboard.id,
        name,
        score,
        details: null,
      });

      if (result.error || !result.data) throw result.error;

      updateEntriesState((prevEntries) => [...prevEntries, result.data as ScoreboardEntry]);
      showToast('Entry added successfully', 'success');
    } catch (_err) {
      showToast(_err instanceof Error ? _err.message : 'Failed to add entry', 'error');
    }
  };

  const handleEditEntry = async (id: string, name: string, score: number) => {
    if (!scoreboard) return;

    if (isReadOnly) {
      showToast('This scoreboard is read-only on the Free plan.', 'info');
      return;
    }

    try {
      const { data, error } = await scoreboardService.updateEntry(scoreboard.id, id, {
        name,
        score,
      });
      if (error || !data) throw error;

      updateEntriesState((prevEntries) =>
        prevEntries.map((entry) => (entry.id === id ? { ...entry, ...data } : entry))
      );
      showToast('Entry updated successfully', 'success');
    } catch (_err) {
      showToast(_err instanceof Error ? _err.message : 'Failed to update entry', 'error');
    }
  };

  const handleDeleteEntry = (id: string) => {
    if (!scoreboard) return;

    const entryToDelete = entries.find((e) => e.id === id);
    if (!entryToDelete) return;

    const deleteId = `delete-entry-${id}`;

    // Optimistically remove from UI
    setEntries((prev) => prev.filter((e) => e.id !== id));

    // Set up delayed API delete (5 seconds)
    const timerId = setTimeout(async () => {
      pendingDeletesRef.current.delete(deleteId);
      try {
        const { error } = await scoreboardService.deleteEntry(scoreboard.id, id);
        if (error) {
          // Restore on error
          setEntries((prev) => [...prev, entryToDelete]);
          showToast('Failed to delete entry', 'error');
        }
      } catch {
        // Restore on error
        setEntries((prev) => [...prev, entryToDelete]);
        showToast('Failed to delete entry', 'error');
      }
    }, 5000);

    // Track pending delete
    pendingDeletesRef.current.set(deleteId, { entry: entryToDelete, timerId });

    // Add undo action
    addUndoAction({
      id: deleteId,
      message: `Deleted "${entryToDelete.name}"`,
      timestamp: Date.now(),
      undo: async () => {
        // Cancel the pending delete
        const pending = pendingDeletesRef.current.get(deleteId);
        if (pending) {
          clearTimeout(pending.timerId);
          pendingDeletesRef.current.delete(deleteId);
        }
        // Restore to UI
        setEntries((prev) => [...prev, entryToDelete]);
      },
    });
  };

  const handleImportCSV = async (importedEntries: { name: string; score: number }[]) => {
    if (!scoreboard) return;

    if (isReadOnly) {
      showToast('This scoreboard is read-only on the Free plan.', 'info');
      return;
    }

    if (isEntryLimitReached) {
      showToast("You've reached the maximum of 50 entries on the free plan.", 'error');
      return;
    }

    if (isFreeUser && entryUsage + importedEntries.length > entryLimit) {
      showToast('Import would exceed the 50-entry limit on the Free plan.', 'error');
      return;
    }

    try {
      const result = await scoreboardService.createEntriesBulk(
        scoreboard.id,
        importedEntries.map((e) => ({ name: e.name, score: e.score, details: null }))
      );

      if (result.error || !result.data) {
        throw result.error || new Error('Failed to import entries');
      }

      updateEntriesState((prevEntries) => [...prevEntries, ...result.data!]);
      showToast(`${result.data.length} entries imported successfully`, 'success');
    } catch (_err) {
      showToast('Failed to import entries', 'error');
    }
  };

  const handleClearAll = () => {
    if (!scoreboard) return;

    setConfirmModal({
      isOpen: true,
      title: 'Clear All Entries',
      message:
        'Are you sure you want to delete all entries? This action cannot be undone and will remove all participant data from this scoreboard.',
      onConfirm: async () => {
        setConfirmModal((prev) => ({
          ...prev,
          isProcessing: true,
          processingText: 'Clearing all entries...',
        }));
        try {
          const { error } = await scoreboardService.deleteAllEntries(scoreboard.id);
          if (error) throw error;

          setEntries([]);
          showToast('All entries cleared successfully', 'success');
        } catch (_err) {
          showToast('Failed to clear all entries', 'error');
        } finally {
          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
            isProcessing: false,
            processingText: '',
          }));
        }
      },
    });
  };

  const handleSort = (column: 'rank' | 'name' | 'score') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getPublicViewUrl = () => {
    if (typeof window === 'undefined' || !scoreboardId) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/individual-scoreboard-view?id=${scoreboardId}`;
  };

  const handleCopyUrl = async () => {
    const url = getPublicViewUrl();
    try {
      await navigator.clipboard.writeText(url);
      showToast('URL copied to clipboard', 'success');
    } catch (_err) {
      // Clipboard API blocked (e.g., VS Code Simple Browser)
      showToast('Copy failed - try a different browser', 'error');
    }
  };

  const handleOpenInNewTab = () => {
    const url = getPublicViewUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleExportCSV = async () => {
    if (!scoreboardId) return;
    setIsExporting(true);
    try {
      const getHeaders = async (): Promise<Record<string, string>> => {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) return {};
        return { Authorization: `Bearer ${accessToken}` };
      };
      const result = await downloadScoreboardCSV(scoreboardId, getHeaders);
      if (result.success) {
        showToast('Scoreboard exported successfully', 'success');
      } else {
        showToast(result.error || 'Failed to export scoreboard', 'error');
      }
    } catch (_err) {
      showToast('Failed to export scoreboard', 'error');
    } finally {
      if (isMounted()) {
        setIsExporting(false);
      }
    }
  };

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredEntries.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

  // Loading state
  if (!isHydrated || loading || authLoading) {
    return (
      <div className="min-h-screen bg-background pt-16 landscape-mobile:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 landscape-mobile:py-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background pt-16 landscape-mobile:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 landscape-mobile:py-4">
          <div className="bg-red-500/10 border border-destructive rounded-lg p-6 text-center">
            <Icon
              name="ExclamationTriangleIcon"
              size={48}
              className="text-destructive mx-auto mb-4"
            />
            <h2 className="text-xl font-semibold text-destructive mb-2">
              Unable to Load Scoreboard
            </h2>
            <p className="text-sm text-text-secondary mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
              title="Return to dashboard"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!scoreboard) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card border border-border rounded-lg p-6 mb-6 elevation-1">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-text-primary">{scoreboard.title}</h1>
                <button
                  onClick={() => setIsEditScoreboardModalOpen(true)}
                  disabled={isReadOnly}
                  className="p-1.5 rounded-md hover:bg-muted transition-smooth duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  title={isReadOnly ? 'Scoreboard is read-only' : 'Edit scoreboard details'}
                >
                  <Icon
                    name="PencilIcon"
                    size={18}
                    className="text-text-secondary hover:text-primary"
                  />
                </button>
              </div>
              <p
                className={`text-sm text-text-secondary ${!scoreboard.description ? 'italic' : ''}`}
              >
                {scoreboard.description || 'No description available'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
                title="Back to dashboard"
              >
                <Icon name="ArrowLeftIcon" size={18} />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <Icon name="UsersIcon" size={18} />
              <span>Total Entries: {entries.length}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Icon
                  name={scoreboard.visibility === 'public' ? 'GlobeAltIcon' : 'LockClosedIcon'}
                  size={18}
                />
                <span className="capitalize">{scoreboard.visibility}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenInNewTab}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-primary hover:bg-red-600/10 transition-colors duration-150"
                  title="Open public view in new tab"
                >
                  <Icon name="ArrowTopRightOnSquareIcon" size={16} />
                  <span className="hidden sm:inline">View</span>
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-orange-900 hover:bg-orange-900/10 transition-colors duration-150"
                  title="Copy public URL to clipboard"
                >
                  <Icon name="ClipboardDocumentIcon" size={16} />
                  <span className="hidden sm:inline">Copy URL</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {isReadOnly && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Icon name="LockClosedIcon" size={20} className="text-yellow-700 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Read-only mode</p>
                <p className="mt-1">
                  This scoreboard is locked on the Free plan. Public boards can be unlocked up to
                  your limit. Private boards remain locked.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {canUnlockScoreboard ? (
                    <button
                      onClick={handleUnlockScoreboard}
                      disabled={isUnlocking}
                      className="px-3 py-1.5 text-primary rounded-md font-medium text-sm hover:bg-red-600/10 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      title="Unlock this scoreboard"
                    >
                      {isUnlocking ? 'Unlocking...' : 'Unlock Scoreboard'}
                    </button>
                  ) : (
                    <Link
                      href="/supporter-plan"
                      className="px-3 py-1.5 text-orange-900 rounded-md font-medium text-sm hover:bg-orange-900/10 transition-colors duration-150"
                      title="Become a Supporter to unlock more"
                    >
                      Become a Supporter to unlock more
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {isFreeUser && (
          <div className="mb-6">
            <UsageCounterBlock
              label="entries on this scoreboard"
              used={entryUsage}
              max={entryLimit}
              ctaHref="/supporter-plan"
              ctaLabel="Become a Supporter to unlock more"
              warningText={
                isEntryApproachingLimit
                  ? 'You’re close to the 50-entry limit. Consider upgrading if you need more room.'
                  : undefined
              }
            />
          </div>
        )}

        <StyleCustomizationSection
          currentStyles={scoreboard.customStyles}
          currentScope={scoreboard.styleScope || 'both'}
          onSave={handleSaveStyles}
          isSaving={isSavingStyles}
          scoreboardId={scoreboard.id}
          isExpanded={isStyleSectionExpanded}
          onToggleExpanded={setIsStyleSectionExpanded}
          isSupporter={Boolean(subscriptionTier)}
          isReadOnly={isReadOnly}
        />

        <EmbedCodeSection
          scoreboardId={scoreboard.id}
          scoreboardTitle={scoreboard.title}
          isExpanded={isEmbedSectionExpanded}
          onToggleExpanded={setIsEmbedSectionExpanded}
          isSupporter={Boolean(subscriptionTier)}
        />

        <KioskSettingsSection
          scoreboardId={scoreboard.id}
          scoreboardTitle={scoreboard.title}
          isExpanded={isKioskSectionExpanded}
          onToggle={() => setIsKioskSectionExpanded(!isKioskSectionExpanded)}
          onShowToast={showToast}
        />

        <div className="bg-card border border-border rounded-lg elevation-1">
          <div className="p-6 border-b border-border">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 max-w-md">
                <SearchInterface
                  placeholder="Search entries by name..."
                  onSearch={setSearchQuery}
                  debounceMs={200}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  disabled={isReadOnly || isEntryLimitReached}
                  className="flex items-center space-x-2 px-2 py-2 text-sm sm:px-3 md:px-4 md:text-base rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-smooth duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-100"
                  title={
                    isReadOnly
                      ? 'Scoreboard is read-only'
                      : isEntryLimitReached
                        ? 'Entry limit reached'
                        : 'Add new entry'
                  }
                >
                  <Icon name="PlusIcon" size={20} />
                  <span className="hidden sm:inline">Add Entry</span>
                  <span className="sr-only sm:hidden">Add Entry</span>
                </button>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  disabled={isReadOnly || isEntryLimitReached}
                  className="flex items-center space-x-2 px-2 py-2 text-sm sm:px-3 md:px-4 md:text-base rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-smooth duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-100"
                  title={
                    isReadOnly
                      ? 'Scoreboard is read-only'
                      : isEntryLimitReached
                        ? 'Entry limit reached'
                        : 'Import entries from CSV file'
                  }
                >
                  <Icon name="ArrowUpTrayIcon" size={20} />
                  <span className="hidden sm:inline">Import CSV</span>
                  <span className="sr-only sm:hidden">Import CSV</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="flex items-center space-x-2 px-2 py-2 text-sm sm:px-3 md:px-4 md:text-base rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-smooth duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-100"
                  title="Export scoreboard to CSV"
                >
                  <Icon name="DocumentArrowDownIcon" size={20} />
                  <span className="hidden sm:inline">
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                  </span>
                  <span className="sr-only sm:hidden">Export CSV</span>
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={entries.length === 0 || isReadOnly}
                  className="flex items-center space-x-2 px-2 py-2 text-sm sm:px-3 md:px-4 md:text-base rounded-md bg-destructive text-destructive-foreground hover:opacity-90 transition-smooth duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-100"
                  title="Delete all entries"
                >
                  <Icon name="TrashIcon" size={20} />
                  <span className="hidden sm:inline">Clear All</span>
                  <span className="sr-only sm:hidden">Clear All</span>
                </button>
              </div>
            </div>
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('rank')}
                      className="flex items-center space-x-1 text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary transition-smooth duration-150"
                      title="Sort by rank"
                    >
                      <span>Rank</span>
                      {sortBy === 'rank' && (
                        <Icon
                          name={sortOrder === 'asc' ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                          size={14}
                        />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary transition-smooth duration-150"
                      title="Sort by name"
                    >
                      <span>Name</span>
                      {sortBy === 'name' && (
                        <Icon
                          name={sortOrder === 'asc' ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                          size={14}
                        />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('score')}
                      className="flex items-center space-x-1 text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary transition-smooth duration-150"
                      title="Sort by score"
                    >
                      <span>{scoreboard?.scoreType === 'time' ? 'Time' : 'Score'}</span>
                      {sortBy === 'score' && (
                        <Icon
                          name={sortOrder === 'asc' ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                          size={14}
                        />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {currentEntries.length > 0 ? (
                  currentEntries.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={{ ...entry, rank: entry.rank || 0 }}
                      onEdit={handleEditEntry}
                      onDelete={handleDeleteEntry}
                      scoreType={scoreboard?.scoreType || 'number'}
                      timeFormat={scoreboard?.timeFormat || null}
                      isReadOnly={isReadOnly}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <Icon name="InboxIcon" size={48} className="text-muted-foreground" />
                        <p className="text-sm text-text-secondary">
                          {searchQuery
                            ? 'No entries found matching your search'
                            : 'No entries yet. Add your first entry to get started.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden p-4 space-y-4">
            {currentEntries.length > 0 ? (
              currentEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={{ ...entry, rank: entry.rank || 0 }}
                  onEdit={handleEditEntry}
                  onDelete={handleDeleteEntry}
                  scoreType={scoreboard?.scoreType || 'number'}
                  timeFormat={scoreboard?.timeFormat || null}
                  isReadOnly={isReadOnly}
                />
              ))
            ) : (
              <div className="flex flex-col items-center space-y-3 py-12">
                <Icon name="InboxIcon" size={48} className="text-muted-foreground" />
                <p className="text-sm text-text-secondary text-center">
                  {searchQuery
                    ? 'No entries found matching your search'
                    : 'No entries yet. Add your first entry to get started.'}
                </p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  Showing {indexOfFirstEntry + 1} to{' '}
                  {Math.min(indexOfLastEntry, filteredEntries.length)} of {filteredEntries.length}{' '}
                  entries
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-md border border-input text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    title="Go to previous page"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-text-secondary">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-md border border-input text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    title="Go to next page"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddEntry}
        scoreType={scoreboard?.scoreType || 'number'}
        timeFormat={scoreboard?.timeFormat || null}
      />

      <ImportCSVModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCSV}
        scoreType={scoreboard?.scoreType || 'number'}
        timeFormat={scoreboard?.timeFormat || null}
      />

      <EditScoreboardModal
        isOpen={isEditScoreboardModalOpen}
        onClose={() => setIsEditScoreboardModalOpen(false)}
        onSave={handleEditScoreboard}
        currentTitle={scoreboard?.title || ''}
        currentDescription={scoreboard?.description || ''}
        currentVisibility={scoreboard?.visibility || 'public'}
        currentScoreType={scoreboard?.scoreType || 'number'}
        currentSortOrder={scoreboard?.sortOrder || 'desc'}
        currentTimeFormat={scoreboard?.timeFormat || null}
        entryCount={entries.length}
        isSupporter={!isFreeUser}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="danger"
        isProcessing={confirmModal.isProcessing}
        processingText={confirmModal.processingText}
      />

      <Toast
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
    </div>
  );
};

export default ScoreboardManagementInteractive;
