'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import SearchInterface from '@/components/common/SearchInterface';
import { scoreboardService } from '@/services/scoreboardService';
import { Scoreboard, ScoreboardEntry, ScoreboardCustomStyles } from '@/types/models';
import { getStylePreset, generateCustomStyles } from '@/utils/stylePresets';

interface EntryWithRank extends ScoreboardEntry {
  rank: number;
}

export default function EmbedScoreboardPage() {
  const params = useParams();
  const scoreboardId = params?.id as string;
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [entries, setEntries] = useState<ScoreboardEntry[]>([]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const loadEntriesOnly = async () => {
    if (!scoreboardId) return;
    
    try {
      const { data: entriesData, error: entriesError } = await scoreboardService.getScoreboardEntries(scoreboardId);
      
      if (!entriesError) {
        setEntries(entriesData || []);
      }
    } catch {}
  };

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
    } catch {
      setError('Failed to load scoreboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isHydrated || !scoreboardId) {
      if (isHydrated && !scoreboardId) {
        setError('No scoreboard ID provided');
        setIsLoading(false);
      }
      return;
    }
    
    loadScoreboardData();

    const unsubscribe = scoreboardService.subscribeToScoreboardChanges(
      scoreboardId,
      {
        onScoreboardChange: () => loadScoreboardData(),
        onEntriesChange: () => loadEntriesOnly()
      }
    );

    return () => unsubscribe();
  }, [isHydrated, scoreboardId]);

  const sortedEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      const scoreA = Number(a.score);
      const scoreB = Number(b.score);
      
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.name.localeCompare(b.name);
    });

    return sorted.map((entry, index): EntryWithRank => ({
      ...entry,
      rank: index + 1,
    }));
  }, [entries]);

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

  const shouldApplyStyles = (scope?: 'main' | 'embed' | 'both') => {
    return scope === 'embed' || scope === 'both' || !scope;
  };

  const getAppliedStyles = (): ScoreboardCustomStyles | null => {
    if (!scoreboard?.customStyles) return null;
    if (!shouldApplyStyles(scoreboard.styleScope)) return null;
    
    if (scoreboard.customStyles.preset && scoreboard.customStyles.preset !== 'light') {
      const presetStyles = getStylePreset(scoreboard.customStyles.preset);
      return { ...presetStyles, ...scoreboard.customStyles };
    }
    
    return scoreboard.customStyles;
  };

  const appliedStyles = getAppliedStyles();
  const customCssVars = appliedStyles ? generateCustomStyles(appliedStyles) : {};

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={customCssVars}>
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-300 rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !scoreboard) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={customCssVars}>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2" style={{ color: appliedStyles?.textColor || '#1f2937' }}>
            Unable to Load Scoreboard
          </h2>
          <p className="text-sm" style={{ color: appliedStyles?.textColor ? `${appliedStyles.textColor}99` : '#6b7280' }}>
            {error || 'Scoreboard not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4"
      style={{
        backgroundColor: appliedStyles?.backgroundColor || '#ffffff',
        color: appliedStyles?.textColor || '#1f2937',
        fontFamily: appliedStyles?.fontFamily || 'inherit',
        ...customCssVars
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: appliedStyles?.headerColor || appliedStyles?.textColor || '#1f2937' }}
          >
            {scoreboard.title}
          </h1>
          {scoreboard.subtitle && (
            <p 
              className="text-sm opacity-80"
              style={{ color: appliedStyles?.textColor || '#6b7280' }}
            >
              {scoreboard.subtitle}
            </p>
          )}
          <div className="mt-3 text-sm opacity-70">
            Total Entries: {entries.length}
          </div>
        </div>

        <div className="mb-4">
          <SearchInterface
            placeholder="Search by name..."
            onSearch={handleSearch}
            debounceMs={200}
            className="max-w-md mx-auto"
            showClearButton={true}
          />
        </div>

        {currentEntries.length === 0 ? (
          <div 
            className="text-center py-12 rounded-lg"
            style={{
              backgroundColor: appliedStyles?.backgroundColor ? `${appliedStyles.backgroundColor}` : '#f9fafb',
              borderColor: appliedStyles?.borderColor || '#e5e7eb',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderRadius: appliedStyles?.borderRadius || '8px'
            }}
          >
            <p style={{ color: appliedStyles?.textColor || '#6b7280' }}>
              {searchQuery ? 'No entries found matching your search' : 'No entries yet'}
            </p>
          </div>
        ) : (
          <>
            <div 
              className="overflow-hidden mb-4"
              style={{
                borderColor: appliedStyles?.borderColor || '#e5e7eb',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: appliedStyles?.borderRadius || '8px'
              }}
            >
              <table className="w-full">
                <thead>
                  <tr 
                    style={{ 
                      backgroundColor: appliedStyles?.headerColor || '#f3f4f6',
                      color: appliedStyles?.headerTextColor || appliedStyles?.textColor || '#374151'
                    }}
                  >
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEntries.map((entry, index) => (
                    <tr 
                      key={entry.id}
                      className="transition-colors"
                      style={{ 
                        backgroundColor: index % 2 === 0 
                          ? (appliedStyles?.backgroundColor || '#ffffff')
                          : (appliedStyles?.rowHoverColor || '#f9fafb'),
                        borderBottom: `1px solid ${appliedStyles?.borderColor || '#e5e7eb'}`
                      }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span 
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                            entry.rank <= 3 ? 'text-white' : ''
                          }`}
                          style={{
                            backgroundColor: entry.rank <= 3 
                              ? (appliedStyles?.rankHighlightColor || appliedStyles?.accentColor || '#f77174')
                              : 'transparent',
                            color: entry.rank <= 3 
                              ? '#ffffff' 
                              : (appliedStyles?.textColor || '#374151')
                          }}
                        >
                          #{entry.rank}
                        </span>
                      </td>
                      <td 
                        className="px-4 py-3 font-medium"
                        style={{ color: appliedStyles?.textColor || '#1f2937' }}
                      >
                        {entry.name}
                      </td>
                      <td 
                        className="px-4 py-3 text-right font-semibold"
                        style={{ color: appliedStyles?.accentColor || appliedStyles?.textColor || '#1f2937' }}
                      >
                        {Number(entry.score).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: appliedStyles?.textColor ? `${appliedStyles.textColor}99` : '#6b7280' }}>
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredEntries.length)} of {filteredEntries.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded disabled:opacity-50"
                    style={{
                      backgroundColor: appliedStyles?.accentColor || '#f77174',
                      color: '#ffffff'
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded disabled:opacity-50"
                    style={{
                      backgroundColor: appliedStyles?.accentColor || '#f77174',
                      color: '#ffffff'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
