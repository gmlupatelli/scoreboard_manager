'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { scoreboardService } from '../../../services/scoreboardService';
import { Scoreboard, ScoreboardEntry } from '../../../types/models';
import SearchInterface from '@/components/common/SearchInterface';
import Icon from '@/components/ui/AppIcon';
import EntryRow from './EntryRow';
import EntryCard from './EntryCard';
import AddEntryModal from './AddEntryModal';
import ImportCSVModal from './ImportCSVModal';
import ConfirmationModal from './ConfirmationModal';
import Toast from './Toast';
import EditScoreboardModal from './EditScoreboardModal';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}

const ScoreboardManagementInteractive = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scoreboardId = searchParams.get('id');
  const { user, loading: authLoading } = useAuth();
  
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
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    isVisible: false
  });

  // Redirect if not authenticated or no scoreboard ID
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (!scoreboardId) {
        showToast('No scoreboard selected. Redirecting to dashboard...', 'error');
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }
    }
  }, [user, authLoading, scoreboardId, router]);

  // Load scoreboard and entries
  useEffect(() => {
    if (user && scoreboardId) {
      loadScoreboardData();
    }
  }, [user, scoreboardId]);

  const loadScoreboardData = async () => {
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

      // Check if user has access to this scoreboard
      if (scoreboardResult.data.ownerId !== user?.id && user?.role !== 'system_admin') {
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
      setError(errorMessage);
      showToast(errorMessage, 'error');
      
      // Redirect to dashboard after showing error
      setTimeout(() => router.push('/dashboard'), 3000);
    } finally {
      setLoading(false);
      setIsHydrated(true);
    }
  };

  useEffect(() => {
    let filtered = entries.filter(entry =>
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
  }, [searchQuery, entries, sortBy, sortOrder]);

  const recalculateRanks = (entriesList: ScoreboardEntry[]): ScoreboardEntry[] => {
    const sorted = [...entriesList].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const handleEditScoreboard = async (title: string, subtitle: string, visibility: 'public' | 'private') => {
    if (!scoreboard) return;
    
    try {
      const { error } = await scoreboardService.updateScoreboard(scoreboard.id, {
        title,
        subtitle,
        visibility
      });
      
      if (error) throw error;
      
      await loadScoreboardData();
      showToast('Scoreboard details updated successfully', 'success');
    } catch {
      showToast('Failed to update scoreboard details', 'error');
    }
  };

  const handleAddEntry = async (name: string, score: number) => {
    if (!scoreboard) return;
    
    try {
      // FIXED: Use createEntry instead of addEntry
      const result = await scoreboardService.createEntry({
        scoreboardId: scoreboard.id,
        name,
        score,
        details: null
      });
      
      if (result.error) throw result.error;
      
      await loadScoreboardData();
      showToast('Entry added successfully', 'success');
    } catch (err) {
      showToast('Failed to add entry', 'error');
    }
  };

  const handleEditEntry = async (id: string, name: string, score: number) => {
    if (!scoreboard) return;
    
    try {
      const { error } = await scoreboardService.updateEntry(id, { name, score });
      if (error) throw error;
      
      await loadScoreboardData();
      showToast('Entry updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update entry', 'error');
    }
  };

  const handleDeleteEntry = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Entry',
      message: 'Are you sure you want to delete this entry? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const { error } = await scoreboardService.deleteEntry(id);
          if (error) throw error;
          
          await loadScoreboardData();
          showToast('Entry deleted successfully', 'success');
        } catch (err) {
          showToast('Failed to delete entry', 'error');
        } finally {
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      }
    });
  };

  const handleImportCSV = async (importedEntries: { name: string; score: number }[]) => {
    if (!scoreboard) return;
    
    try {
      // FIXED: Use createEntry instead of addEntry for each entry
      for (const entry of importedEntries) {
        const result = await scoreboardService.createEntry({
          scoreboardId: scoreboard.id,
          name: entry.name,
          score: entry.score,
          details: null
        });
        if (result.error) throw result.error;
      }
      
      await loadScoreboardData();
      showToast(`${importedEntries.length} entries imported successfully`, 'success');
    } catch (err) {
      showToast('Failed to import some entries', 'error');
    }
  };

  const handleClearAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear All Entries',
      message: 'Are you sure you want to delete all entries? This action cannot be undone and will remove all participant data from this scoreboard.',
      onConfirm: async () => {
        try {
          // Delete all entries
          for (const entry of entries) {
            const { error } = await scoreboardService.deleteEntry(entry.id);
            if (error) throw error;
          }
          
          await loadScoreboardData();
          showToast('All entries cleared successfully', 'success');
        } catch (err) {
          showToast('Failed to clear all entries', 'error');
        } finally {
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      }
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
    } catch (err) {
      showToast('Failed to copy URL', 'error');
    }
  };

  const handleOpenInNewTab = () => {
    const url = getPublicViewUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredEntries.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

  // Loading state
  if (!isHydrated || loading || authLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
            <Icon name="ExclamationTriangleIcon" size={48} className="text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-destructive mb-2">Unable to Load Scoreboard</h2>
            <p className="text-sm text-text-secondary mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
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
                  className="p-1.5 rounded-md hover:bg-muted transition-smooth duration-150"
                  title="Edit scoreboard details"
                >
                  <Icon name="PencilIcon" size={18} className="text-text-secondary hover:text-primary" />
                </button>
              </div>
              <p className={`text-sm text-text-secondary ${!scoreboard.subtitle ? 'italic' : ''}`}>{scoreboard.subtitle || 'No description available'}</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
            >
              <Icon name="ArrowLeftIcon" size={18} />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
          </div>
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <Icon name="UsersIcon" size={18} />
              <span>Total Entries: {entries.length}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Icon name="EyeIcon" size={18} />
                <span className="capitalize">{scoreboard.visibility}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenInNewTab}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-smooth duration-150"
                  title="Open public view in new tab"
                >
                  <Icon name="ArrowTopRightOnSquareIcon" size={16} />
                  <span className="hidden sm:inline">View</span>
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-secondary/10 text-secondary hover:bg-secondary/20 transition-smooth duration-150"
                  title="Copy public URL to clipboard"
                >
                  <Icon name="ClipboardDocumentIcon" size={16} />
                  <span className="hidden sm:inline">Copy URL</span>
                </button>
              </div>
            </div>
          </div>
        </div>

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
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-smooth duration-150 font-medium"
                >
                  <Icon name="PlusIcon" size={18} />
                  <span>Add Entry</span>
                </button>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-smooth duration-150 font-medium"
                >
                  <Icon name="ArrowUpTrayIcon" size={18} />
                  <span>Import CSV</span>
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={entries.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:opacity-90 transition-smooth duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="TrashIcon" size={18} />
                  <span>Clear All</span>
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
                    >
                      <span>Rank</span>
                      {sortBy === 'rank' && (
                        <Icon name={sortOrder === 'asc' ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary transition-smooth duration-150"
                    >
                      <span>Name</span>
                      {sortBy === 'name' && (
                        <Icon name={sortOrder === 'asc' ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('score')}
                      className="flex items-center space-x-1 text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary transition-smooth duration-150"
                    >
                      <span>Score</span>
                      {sortBy === 'score' && (
                        <Icon name={sortOrder === 'asc' ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {currentEntries.length > 0 ? (
                  currentEntries.map(entry => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      onEdit={handleEditEntry}
                      onDelete={handleDeleteEntry}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <Icon name="InboxIcon" size={48} className="text-muted-foreground" />
                        <p className="text-sm text-text-secondary">
                          {searchQuery ? 'No entries found matching your search' : 'No entries yet. Add your first entry to get started.'}
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
              currentEntries.map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEditEntry}
                  onDelete={handleDeleteEntry}
                />
              ))
            ) : (
              <div className="flex flex-col items-center space-y-3 py-12">
                <Icon name="InboxIcon" size={48} className="text-muted-foreground" />
                <p className="text-sm text-text-secondary text-center">
                  {searchQuery ? 'No entries found matching your search' : 'No entries yet. Add your first entry to get started.'}
                </p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredEntries.length)} of {filteredEntries.length} entries
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-md border border-input text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-text-secondary">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-md border border-input text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
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
      />

      <ImportCSVModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCSV}
      />

      <EditScoreboardModal
        isOpen={isEditScoreboardModalOpen}
        onClose={() => setIsEditScoreboardModalOpen(false)}
        onSave={handleEditScoreboard}
        currentTitle={scoreboard?.title || ''}
        currentSubtitle={scoreboard?.subtitle || ''}
        currentVisibility={scoreboard?.visibility || 'public'}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="danger"
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
};

export default ScoreboardManagementInteractive;