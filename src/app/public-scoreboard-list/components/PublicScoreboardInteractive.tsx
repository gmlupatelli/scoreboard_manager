'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { scoreboardService } from '../../../services/scoreboardService';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';
import Icon from '@/components/ui/AppIcon';
import PublicScoreboardCard from './PublicScoreboardCard';
import PublicHeader from '../../../components/common/PublicHeader';
import { Scoreboard } from '../../../types/models';

const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 300;

const PublicScoreboardInteractive = () => {
  const [scoreboards, setScoreboards] = useState<Scoreboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  // Track offset in a ref to avoid recreating the callback
  const offsetRef = useRef(0);

  // Keep ref in sync with state
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const loadPublicScoreboards = useCallback(
    async (isInitial = true, search = '', sort: 'newest' | 'oldest' | 'title' = 'newest') => {
      if (isInitial) {
        setLoading(true);
        setOffset(0);
        offsetRef.current = 0;
        setScoreboards([]);
      } else {
        setLoadingMore(true);
      }
      setError('');

      try {
        const currentOffset = isInitial ? 0 : offsetRef.current;
        const {
          data,
          error,
          hasMore: more,
          totalCount: count,
        } = await scoreboardService.getPublicScoreboardsPaginated({
          limit: PAGE_SIZE,
          offset: currentOffset,
          search: search || undefined,
          sortBy: sort,
        });

        if (error) {
          setError(error.message);
        } else {
          if (isInitial) {
            setScoreboards(data || []);
          } else {
            setScoreboards((prev) => [...prev, ...(data || [])]);
          }
          setHasMore(more);
          setTotalCount(count);
          const newOffset = currentOffset + (data?.length || 0);
          setOffset(newOffset);
          offsetRef.current = newOffset;
        }
      } catch {
        setError('Failed to load scoreboards');
      } finally {
        if (isInitial) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    []
  );

  // Debounce search input
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

  // Load scoreboards when debounced search or sortBy changes
  useEffect(() => {
    loadPublicScoreboards(true, debouncedSearch, sortBy);
  }, [debouncedSearch, sortBy, loadPublicScoreboards]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadPublicScoreboards(false, debouncedSearch, sortBy);
    }
  }, [loadingMore, hasMore, debouncedSearch, sortBy, loadPublicScoreboards]);

  const { loadMoreRef } = useInfiniteScroll({
    hasMore,
    isLoading: loadingMore,
    onLoadMore: handleLoadMore,
  });

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="TrophyIcon" size={32} className="text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Public Scoreboards</h1>
            </div>
            <p className="text-muted-foreground">
              Browse and view public scoreboards from the community
            </p>
          </div>

          <div className="mb-6 flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Icon
                name="MagnifyingGlassIcon"
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scoreboards..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
              className="px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">By Title</option>
            </select>
          </div>

          {!loading && !error && (
            <div className="mb-6 flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Icon name="ChartBarIcon" size={16} />
                <span>
                  {scoreboards.length} of {totalCount} scoreboards loaded
                  {debouncedSearch && ` matching "${debouncedSearch}"`}
                </span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">
                {searchQuery ? 'Searching scoreboards...' : 'Loading scoreboards...'}
              </p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-center space-x-2">
              <Icon name="ExclamationTriangleIcon" size={20} />
              <span>{error}</span>
            </div>
          ) : scoreboards.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="InboxIcon" size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No scoreboards found</p>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'No public scoreboards available yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scoreboards.map((scoreboard) => (
                  <PublicScoreboardCard key={scoreboard?.id} scoreboard={scoreboard} />
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
          )}
        </div>
      </div>
    </>
  );
};

export default PublicScoreboardInteractive;
