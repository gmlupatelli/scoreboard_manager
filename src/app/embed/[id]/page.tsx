'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import SearchInterface from '@/components/common/SearchInterface';
import Icon from '@/components/ui/AppIcon';
import { scoreboardService } from '@/services/scoreboardService';
import { Scoreboard, ScoreboardEntry, ScoreboardCustomStyles } from '@/types/models';
import { getStylePreset, generateCustomStyles } from '@/utils/stylePresets';
import { formatScoreDisplay } from '@/utils/timeUtils';

interface EntryWithRank extends ScoreboardEntry {
  rank: number;
}

const getRankColor = (rank: number, styles: ScoreboardCustomStyles): string => {
  if (rank === 1) return styles.rank1Color || '#ca8a04';
  if (rank === 2) return styles.rank2Color || '#9ca3af';
  if (rank === 3) return styles.rank3Color || '#b45309';
  return styles.textColor || '#1f2937';
};

const getRankIcon = (rank: number, styles: ScoreboardCustomStyles): string | null => {
  if (rank === 1) return styles.rank1Icon || 'TrophyIcon';
  if (rank === 2) return styles.rank2Icon || 'TrophyIcon';
  if (rank === 3) return styles.rank3Icon || 'TrophyIcon';
  if (rank <= 3) return 'TrophyIcon';
  return null;
};

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

  const loadEntriesOnly = useCallback(async () => {
    if (!scoreboardId) return;

    try {
      const { data: entriesData, error: entriesError } =
        await scoreboardService.getScoreboardEntries(scoreboardId);

      if (!entriesError) {
        setEntries(entriesData || []);
      }
    } catch (_error) {
      setError('Failed to refresh entries');
    }
  }, [scoreboardId]);

  const loadScoreboardData = useCallback(async () => {
    if (!scoreboardId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: scoreboardData, error: scoreboardError } =
        await scoreboardService.getScoreboard(scoreboardId);

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

      const { data: entriesData, error: entriesError } =
        await scoreboardService.getScoreboardEntries(scoreboardId);

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
  }, [scoreboardId]);

  useEffect(() => {
    if (!isHydrated || !scoreboardId) {
      if (isHydrated && !scoreboardId) {
        setError('No scoreboard ID provided');
        setIsLoading(false);
      }
      return;
    }

    loadScoreboardData();

    const unsubscribe = scoreboardService.subscribeToScoreboardChanges(scoreboardId, {
      onScoreboardChange: () => loadScoreboardData(),
      onEntriesChange: () => loadEntriesOnly(),
    });

    return () => unsubscribe();
  }, [isHydrated, scoreboardId, loadScoreboardData, loadEntriesOnly]);

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

  const shouldApplyStyles = (scope?: 'main' | 'embed' | 'both') => {
    return scope === 'embed' || scope === 'both' || !scope;
  };

  const getAppliedStyles = (): ScoreboardCustomStyles => {
    const lightPreset = getStylePreset('light');

    if (!scoreboard?.customStyles) {
      return lightPreset;
    }

    if (!shouldApplyStyles(scoreboard.styleScope)) {
      return lightPreset;
    }

    if (scoreboard.customStyles.preset) {
      const presetStyles = getStylePreset(scoreboard.customStyles.preset);
      return { ...presetStyles, ...scoreboard.customStyles };
    }

    return { ...lightPreset, ...scoreboard.customStyles };
  };

  useEffect(() => {
    // Recalculate styles when styleScope or customStyles change
  }, [scoreboard?.styleScope, scoreboard?.customStyles?.preset]);

  const appliedStyles = getAppliedStyles();
  const customCssVars = generateCustomStyles(appliedStyles);

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
          <h2 className="text-xl font-semibold mb-2" style={{ color: appliedStyles.textColor }}>
            Unable to Load Scoreboard
          </h2>
          <p className="text-sm" style={{ color: `${appliedStyles.textColor}99` }}>
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
        backgroundColor: appliedStyles.backgroundColor,
        color: appliedStyles.textColor,
        fontFamily: appliedStyles.fontFamily,
        ...customCssVars,
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ color: appliedStyles.titleTextColor || appliedStyles.textColor }}
          >
            {scoreboard.title}
          </h1>
          {scoreboard.description && (
            <p
              className="text-base sm:text-lg mb-4"
              style={{
                color: appliedStyles.titleTextColor
                  ? `${appliedStyles.titleTextColor}cc`
                  : `${appliedStyles.textColor}cc`,
              }}
            >
              {scoreboard.description}
            </p>
          )}
          <div
            className="text-sm"
            style={{ color: appliedStyles.titleTextColor || `${appliedStyles.textColor}99` }}
          >
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
              backgroundColor: appliedStyles.backgroundColor,
              borderColor: appliedStyles.borderColor,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderRadius: appliedStyles.borderRadius,
            }}
          >
            <p style={{ color: appliedStyles.textColor }}>
              {searchQuery ? 'No entries found matching your search' : 'No entries yet'}
            </p>
          </div>
        ) : (
          <>
            <div
              className="overflow-hidden mb-4"
              style={{
                borderColor: appliedStyles.borderColor,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: appliedStyles.borderRadius,
              }}
            >
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      backgroundColor: appliedStyles.headerColor,
                      color: appliedStyles.headerTextColor || appliedStyles.textColor,
                    }}
                  >
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                      {scoreboard?.scoreType === 'time' ? 'Time' : 'Score'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentEntries.map((entry, index) => {
                    const rankColor = getRankColor(entry.rank, appliedStyles);
                    const rankIconName = getRankIcon(entry.rank, appliedStyles);
                    const isAlternateRow = index % 2 !== 0;
                    const textColor = isAlternateRow
                      ? appliedStyles.alternateRowTextColor || appliedStyles.textColor
                      : appliedStyles.textColor;

                    return (
                      <tr
                        key={entry.id}
                        className="transition-colors"
                        style={{
                          backgroundColor:
                            index % 2 === 0
                              ? appliedStyles.backgroundColor
                              : appliedStyles.rowHoverColor,
                          borderBottom: `1px solid ${appliedStyles.borderColor}`,
                        }}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div
                            className="flex items-center gap-2 font-semibold"
                            style={{ color: rankColor }}
                          >
                            {rankIconName && (
                              <Icon name={rankIconName} size={18} style={{ color: rankColor }} />
                            )}
                            <span className="text-sm">#{entry.rank}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium" style={{ color: textColor }}>
                          {entry.name}
                        </td>
                        <td
                          className="px-4 py-3 text-right font-semibold"
                          style={{ color: appliedStyles.accentColor || appliedStyles.textColor }}
                        >
                          {formatScoreDisplay(
                            Number(entry.score),
                            scoreboard?.scoreType || 'number',
                            scoreboard?.timeFormat || null
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: `${appliedStyles.textColor}99` }}>
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredEntries.length)} of{' '}
                  {filteredEntries.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded disabled:opacity-50"
                    style={{
                      backgroundColor: appliedStyles.accentColor,
                      color: '#ffffff',
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded disabled:opacity-50"
                    style={{
                      backgroundColor: appliedStyles.accentColor,
                      color: '#ffffff',
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
