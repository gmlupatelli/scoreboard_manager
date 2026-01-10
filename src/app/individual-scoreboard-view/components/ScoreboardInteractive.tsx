'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchInterface from '@/components/common/SearchInterface';
import EntryTable from './EntryTable';
import EntryCard from './EntryCard';
import PaginationControls from './PaginationControls';
import EmptyState from './EmptyState';
import ErrorDisplay from './ErrorDisplay';

import LoadingSkeleton from './LoadingSkeleton';
import ScoreboardHeader from './ScoreboardHeader';
import { scoreboardService } from '@/services/scoreboardService';
import { Scoreboard, ScoreboardEntry, ScoreboardCustomStyles } from '@/types/models';
import { getAppliedScoreboardStyles } from '@/utils/stylePresets';

interface EntryWithRank extends ScoreboardEntry {
  rank: number;
}

const ScoreboardInteractive: React.FC = () => {
  const searchParams = useSearchParams();
  const scoreboardId = searchParams?.get('id') || null;
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [entries, setEntries] = useState<ScoreboardEntry[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load only entries (for real-time updates - no flash)
  const loadEntriesOnly = async () => {
    if (!scoreboardId) return;
    
    try {
      const { data: entriesData, error: entriesError } = await scoreboardService.getScoreboardEntries(scoreboardId);
      
      if (entriesError) {
        return;
      }

      setEntries(entriesData || []);
    } catch {
    }
  };

  // Load full scoreboard data (initial load or scoreboard metadata changes)
  const loadScoreboardData = async () => {
    if (!scoreboardId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: scoreboardData, error: scoreboardError } = await scoreboardService.getScoreboard(scoreboardId);
      
      if (scoreboardError) {
        setError(scoreboardError.message || 'Failed to load scoreboard');
        setIsLoading(false);
        return;
      }

      if (!scoreboardData) {
        setError('Scoreboard not found');
        setIsLoading(false);
        return;
      }

      setScoreboard(scoreboardData);

      const { data: entriesData, error: entriesError } = await scoreboardService.getScoreboardEntries(scoreboardId);
      
      if (entriesError) {
        setError(entriesError.message || 'Failed to load entries');
        setIsLoading(false);
        return;
      }

      setEntries(entriesData || []);
      setError(null);
    } catch (err) {
      setError('Failed to load scoreboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load scoreboard and entries from Supabase
  useEffect(() => {
    if (!isHydrated || !scoreboardId) {
      if (isHydrated && !scoreboardId) {
        setError('No scoreboard ID provided');
        setIsLoading(false);
      }
      return;
    }
    
    loadScoreboardData();

    // Set up real-time subscription with separate callbacks
    const unsubscribe = scoreboardService.subscribeToScoreboardChanges(
      scoreboardId,
      {
        onScoreboardChange: () => {
          loadScoreboardData();
        },
        onEntriesChange: () => {
          loadEntriesOnly();
        }
      }
    );

    // Cleanup subscription on unmount or when scoreboardId changes
    return () => {
      unsubscribe();
    };
  }, [isHydrated, scoreboardId]);

  const sortedEntries = useMemo(() => {
    const scoreboardSortOrder = scoreboard?.sortOrder || 'desc';
    const sorted = [...entries].sort((a, b) => {
      const scoreA = Number(a.score);
      const scoreB = Number(b.score);
      
      if (scoreA !== scoreB) {
        return scoreboardSortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      }
      return a.name.localeCompare(b.name);
    });

    return sorted.map((entry, index): EntryWithRank => ({
      ...entry,
      rank: index + 1,
    }));
  }, [entries, scoreboard?.sortOrder]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery?.trim()) return sortedEntries;

    const query = searchQuery.toLowerCase();
    return sortedEntries.filter((entry) =>
      entry?.name?.toLowerCase()?.includes(query)
    );
  }, [sortedEntries, searchQuery]);

  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEntries = filteredEntries.slice(startIndex, endIndex);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (isHydrated && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const shouldApplyStyles = (scope?: 'main' | 'embed' | 'both') => {
    return scope === 'main' || scope === 'both';
  };

  const getAppliedStyles = (): ScoreboardCustomStyles | null => {
    return getAppliedScoreboardStyles(scoreboard, 'main');
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <LoadingSkeleton />
          </div>
        </main>
      </div>
    );
  }

  if (error || !scoreboard) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ErrorDisplay message={error || 'Scoreboard not found'} />
          </div>
        </main>
      </div>
    );
  }

  const appliedStyles = getAppliedStyles();

  return (
    <>
      <ScoreboardHeader
        title={scoreboard.title}
        description={scoreboard.subtitle || ''}
        totalEntries={entries.length}
        customStyles={appliedStyles}
      />

      <div 
        className="py-6"
        style={{
          backgroundColor: appliedStyles?.backgroundColor,
          fontFamily: appliedStyles?.fontFamily,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <SearchInterface
              placeholder="Search by name..."
              onSearch={handleSearch}
              debounceMs={200}
              className="max-w-md"
              showClearButton={true}
            />
          </div>

          {currentEntries.length === 0 ? (
            <div 
              className="rounded-lg"
              style={{
                backgroundColor: appliedStyles?.backgroundColor || 'var(--surface)',
                borderColor: appliedStyles?.borderColor || 'var(--border)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: appliedStyles?.borderRadius || '8px',
              }}
            >
              <EmptyState searchQuery={searchQuery} />
            </div>
          ) : (
            <>
              <div 
                className="overflow-hidden mb-6"
                style={{
                  backgroundColor: appliedStyles?.backgroundColor || 'var(--surface)',
                  borderColor: appliedStyles?.borderColor || 'var(--border)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: appliedStyles?.borderRadius || '8px',
                }}
              >
                {isMobile ? (
                  <div className="p-4 space-y-4">
                    {currentEntries.map((entry) => (
                      <EntryCard 
                        key={entry.id} 
                        rank={entry.rank} 
                        name={entry.name} 
                        score={Number(entry.score)}
                        customStyles={appliedStyles}
                        scoreType={scoreboard?.scoreType || 'number'}
                        timeFormat={scoreboard?.timeFormat || null}
                      />
                    ))}
                  </div>
                ) : (
                  <EntryTable 
                    entries={currentEntries.map(e => ({ ...e, score: Number(e.score) }))} 
                    customStyles={appliedStyles}
                    scoreType={scoreboard?.scoreType || 'number'}
                    timeFormat={scoreboard?.timeFormat || null}
                  />
                )}
              </div>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                entriesPerPage={entriesPerPage}
                totalEntries={filteredEntries.length}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ScoreboardInteractive;