'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { scoreboardService } from '../../../services/scoreboardService';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';
import { Scoreboard as ScoreboardModel } from '../../../types/models';
import Header from '@/components/common/Header';
import SearchInterface from '@/components/common/SearchInterface';
import ScoreboardCard from './ScoreboardCard';
import CreateScoreboardModal from './CreateScoreboardModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
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

const AdminDashboardInteractive = () => {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, signOut, isSystemAdmin } = useAuth();
  const [scoreboards, setScoreboards] = useState<ScoreboardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; scoreboard: ScoreboardModel | null }>({
    isOpen: false,
    scoreboard: null,
  });
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', isVisible: false });
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'entries'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [allOwners, setAllOwners] = useState<Owner[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load owners for system admin dropdown
  useEffect(() => {
    if (user && userProfile && isSystemAdmin()) {
      loadOwners();
    }
  }, [user, userProfile]);

  const loadOwners = async () => {
    setLoadingOwners(true);
    try {
      const { data, error } = await scoreboardService.getAllScoreboardOwners();
      if (!error && data) {
        setAllOwners(data);
      }
    } catch (err) {
      console.error('Failed to load owners:', err);
    } finally {
      setLoadingOwners(false);
    }
  };

  const loadScoreboards = useCallback(async (
    isInitial: boolean,
    searchTerm: string,
    ownerFilter: string,
    currentOffset: number
  ) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError('');
    
    try {
      let result;
      
      if (isSystemAdmin()) {
        result = await scoreboardService.getAllScoreboardsPaginated({
          limit: PAGE_SIZE,
          offset: currentOffset,
          search: searchTerm || undefined,
          ownerId: ownerFilter !== 'all' ? ownerFilter : undefined,
        });
      } else {
        result = await scoreboardService.getUserScoreboardsPaginated(user!.id, {
          limit: PAGE_SIZE,
          offset: currentOffset,
          search: searchTerm || undefined,
        });
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        if (isInitial) {
          setScoreboards(result.data || []);
          setOffset(result.data?.length || 0);
        } else {
          setScoreboards(prev => [...prev, ...(result.data || [])]);
          setOffset(currentOffset + (result.data?.length || 0));
        }
        setHasMore(result.hasMore);
        setTotalCount(result.totalCount);
      }
    } catch (err) {
      setError('Failed to load scoreboards');
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [user, isSystemAdmin]);

  // Initial load and reload when search/owner filter changes
  useEffect(() => {
    if (user && userProfile) {
      loadScoreboards(true, searchQuery, selectedOwnerId, 0);
    }
  }, [user, userProfile, searchQuery, selectedOwnerId, loadScoreboards]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadScoreboards(false, searchQuery, selectedOwnerId, offset);
    }
  }, [loadingMore, hasMore, offset, searchQuery, selectedOwnerId, loadScoreboards]);

  const { loadMoreRef } = useInfiniteScroll({
    hasMore,
    isLoading: loadingMore,
    onLoadMore: handleLoadMore,
  });

  const handleCreateScoreboard = async (title: string, subtitle: string, visibility: 'public' | 'private') => {
    try {
      const { error } = await scoreboardService.createScoreboard({
        ownerId: user!.id,
        title,
        subtitle,
        sortOrder: 'desc',
        visibility,
      });

      if (error) {
        throw error;
      }

      await loadScoreboards(true, searchQuery, selectedOwnerId, 0);
      return { success: true, message: 'Scoreboard created successfully' };
    } catch (err) {
      return { success: false, message: 'Failed to create scoreboard' };
    }
  };

  const handleDeleteScoreboard = async (id: string) => {
    try {
      const { error } = await scoreboardService.deleteScoreboard(id);
      if (error) throw error;
      
      await loadScoreboards(true, searchQuery, selectedOwnerId, 0);
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  };

  const handleSignOut = async () => {
    router.push('/public-scoreboard-list');
    await signOut();
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleNavigateToScoreboard = (id: string) => {
    router.push(`/scoreboard-management?id=${id}`);
  };

  const totalEntries = scoreboards.reduce((sum, scoreboard) => sum + (scoreboard.entryCount || 0), 0);
  const avgEntriesPerScoreboard = scoreboards.length > 0 
    ? Math.round(totalEntries / scoreboards.length) 
    : 0;

  // Apply client-side sorting only (search and owner filtering is done server-side)
  const sortedScoreboards = [...scoreboards].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'entries':
        comparison = (a.entryCount || 0) - (b.entryCount || 0);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleRenameScoreboard = async (id: string, newTitle: string) => {
    try {
      const { error } = await scoreboardService.updateScoreboard(id, { title: newTitle });
      if (error) throw error;
      
      await loadScoreboards(true, searchQuery, selectedOwnerId, 0);
      showToast('Scoreboard renamed successfully', 'success');
    } catch (err) {
      showToast('Failed to rename scoreboard', 'error');
    }
  };

  const handleDeleteConfirmation = (scoreboard: ScoreboardModel) => {
    setDeleteModal({ isOpen: true, scoreboard });
  };

  const confirmDelete = async () => {
    if (deleteModal.scoreboard) {
      setIsLoading(true);
      
      try {
        const { error } = await scoreboardService.deleteScoreboard(deleteModal.scoreboard.id);
        if (error) throw error;
        
        await loadScoreboards(true, searchQuery, selectedOwnerId, 0);
        showToast('Scoreboard deleted successfully', 'success');
      } catch (err) {
        showToast('Failed to delete scoreboard', 'error');
      } finally {
        setDeleteModal({ isOpen: false, scoreboard: null });
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={!!user} onLogout={handleSignOut} />

      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {isSystemAdmin() ? 'System Admin Dashboard' : 'My Scoreboards'}
              </h1>
              <p className="text-text-secondary">
                {isSystemAdmin() 
                  ? 'Oversee all scoreboards and manage system-wide content' 
                  : 'Manage your scoreboards and competition entries'}
              </p>
            </div>
            {!isSystemAdmin() && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 sm:mt-0 flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth hover-lift"
              >
                <Icon name="PlusIcon" size={20} />
                <span>Create New Scoreboard</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading scoreboards...</p>
            </div>
          ) : scoreboards.length > 0 ? (
            <>
              <div className="bg-card border border-border rounded-lg p-4 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <SearchInterface
                    placeholder="Search scoreboards by title or description..."
                    onSearch={handleSearch}
                    className="w-full lg:w-96"
                  />

                  <div className="flex flex-wrap items-center gap-4">
                    {isSystemAdmin() && (
                      <div className="flex items-center space-x-2">
                        <label htmlFor="ownerFilter" className="text-sm font-medium text-text-secondary">
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
                          placeholder={loadingOwners ? "Loading owners..." : "Filter by owner..."}
                          emptyMessage="No owners found"
                          className="min-w-[220px]"
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
                        description={scoreboard.subtitle || ''}
                        entryCount={scoreboard.entryCount || 0}
                        createdAt={new Date(scoreboard.createdAt).toLocaleDateString()}
                        ownerName={isSystemAdmin() ? scoreboard.owner?.fullName : undefined}
                        onRename={handleRenameScoreboard}
                        onDelete={() => handleDeleteConfirmation(scoreboard)}
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
                  <Icon name="MagnifyingGlassIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
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
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        scoreboardTitle={deleteModal.scoreboard?.title || ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, scoreboard: null })}
      />

      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
};

export default AdminDashboardInteractive;
