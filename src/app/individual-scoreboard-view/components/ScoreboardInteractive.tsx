'use client';

import React, { useState, useEffect, useMemo } from 'react';
import SearchInterface from '@/components/common/SearchInterface';
import EntryTable from './EntryTable';
import EntryCard from './EntryCard';
import PaginationControls from './PaginationControls';
import EmptyState from './EmptyState';
import ErrorDisplay from './ErrorDisplay';

import LoadingSkeleton from './LoadingSkeleton';
import ScoreboardHeader from './ScoreboardHeader';
import { Scoreboard, ScoreboardEntry, ScoreboardCustomStyles } from '@/types/models';

interface EntryWithRank extends ScoreboardEntry {
  rank: number;
}

interface ScoreboardInteractiveProps {
  scoreboard: Scoreboard | null;
  entries: ScoreboardEntry[];
  appliedStyles: ScoreboardCustomStyles | null;
}

export default function ScoreboardInteractive({
  scoreboard,
  entries,
  appliedStyles,
}: ScoreboardInteractiveProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(50);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

    return sorted.map(
      (entry, index): EntryWithRank => ({
        ...entry,
        rank: index + 1,
      })
    );
  }, [entries, scoreboard?.sortOrder]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery?.trim()) return sortedEntries;

    const query = searchQuery.toLowerCase();
    return sortedEntries.filter((entry) => entry?.name?.toLowerCase()?.includes(query));
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

  if (!isHydrated) {
    return (
      <div className="min-h-screen">
        <main className="pt-16 landscape-mobile:pt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 landscape-mobile:py-4">
            <LoadingSkeleton />
          </div>
        </main>
      </div>
    );
  }

  if (!scoreboard) {
    return (
      <div className="min-h-screen">
        <main className="pt-16 landscape-mobile:pt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 landscape-mobile:py-4">
            <ErrorDisplay message="Scoreboard not found" />
          </div>
        </main>
      </div>
    );
  }

  // appliedStyles is now managed by state and useEffect above

  return (
    <>
      <ScoreboardHeader
        title={scoreboard.title}
        description={scoreboard.description || ''}
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
                  <>
                    <div
                      className="px-6 py-3 border-b"
                      style={{
                        backgroundColor: appliedStyles?.headerColor || 'var(--muted)',
                        borderColor: appliedStyles?.borderColor || 'var(--border)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: appliedStyles?.headerTextColor || 'var(--text-secondary)',
                          }}
                        >
                          Player
                        </span>
                        <span
                          className="text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: appliedStyles?.headerTextColor || 'var(--text-secondary)',
                          }}
                        >
                          {scoreboard?.scoreType === 'time' ? 'Time' : 'Score'}
                        </span>
                      </div>
                    </div>
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
                  </>
                ) : (
                  <EntryTable
                    entries={currentEntries.map((e) => ({ ...e, score: Number(e.score) }))}
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
}
