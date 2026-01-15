'use client';

import { useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';
import { formatScoreDisplay } from '@/utils/timeUtils';
import { getStylePreset } from '@/utils/stylePresets';
import { ScoreboardCustomStyles } from '@/types/models';

interface ScoreboardData {
  id: string;
  title: string;
  description: string | null;
  score_type: 'number' | 'time';
  sort_order: 'asc' | 'desc';
  time_format: string | null;
  custom_styles: Record<string, unknown> | null;
}

interface EntryData {
  id: string;
  name: string;
  score: number;
  details: string | null;
}

interface KioskScoreboardProps {
  scoreboard: ScoreboardData;
  entries: EntryData[];
}

export default function KioskScoreboard({ scoreboard, entries }: KioskScoreboardProps) {
  // Sort entries and assign ranks
  const rankedEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      const scoreA = Number(a.score);
      const scoreB = Number(b.score);

      if (scoreA !== scoreB) {
        return scoreboard.sort_order === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      }
      return a.name.localeCompare(b.name);
    });

    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [entries, scoreboard.sort_order]);

  // Get applied styles - merge preset with custom styles
  const customStyles = scoreboard.custom_styles as ScoreboardCustomStyles | null;
  const presetStyles = getStylePreset(customStyles?.preset || 'dark');
  const appliedStyles: ScoreboardCustomStyles = { ...presetStyles, ...customStyles };

  // Rank styling
  const getRankColor = (rank: number) => {
    if (rank === 1) return appliedStyles.rank1Color || '#fbbf24';
    if (rank === 2) return appliedStyles.rank2Color || '#9ca3af';
    if (rank === 3) return appliedStyles.rank3Color || '#f97316';
    return appliedStyles.textColor || '#ffffff';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return appliedStyles.rank1Icon || 'TrophyIcon';
    if (rank === 2) return appliedStyles.rank2Icon || 'TrophyIcon';
    if (rank === 3) return appliedStyles.rank3Icon || 'TrophyIcon';
    return null;
  };

  // Determine how many entries to show based on screen size
  const maxEntries = 15;
  const displayEntries = rankedEntries.slice(0, maxEntries);

  return (
    <div
      className="h-full w-full flex flex-col p-8"
      style={{
        backgroundColor: appliedStyles.backgroundColor || '#000000',
        color: appliedStyles.textColor || '#ffffff',
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center"
          style={{ color: appliedStyles.titleTextColor || appliedStyles.textColor }}
        >
          {scoreboard.title}
        </h1>
        {scoreboard.description && (
          <p
            className="text-xl md:text-2xl text-center mt-2 opacity-80"
            style={{ color: appliedStyles.textColor }}
          >
            {scoreboard.description}
          </p>
        )}
      </div>

      {/* Entries table */}
      <div className="flex-1 overflow-hidden">
        <div
          className="h-full rounded-xl overflow-hidden"
          style={{
            backgroundColor: appliedStyles.headerColor || 'rgba(255,255,255,0.05)',
            borderColor: appliedStyles.borderColor || 'rgba(255,255,255,0.1)',
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-12 gap-4 px-6 py-4 text-lg font-semibold"
            style={{
              backgroundColor: appliedStyles.headerColor || 'rgba(255,255,255,0.1)',
              color: appliedStyles.headerTextColor || appliedStyles.textColor,
            }}
          >
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-6">Name</div>
            <div className="col-span-4 text-right">Score</div>
          </div>

          {/* Table body */}
          <div
            className="divide-y"
            style={{ borderColor: appliedStyles.borderColor || 'rgba(255,255,255,0.1)' }}
          >
            {displayEntries.map((entry, index) => {
              const rankColor = getRankColor(entry.rank);
              const rankIcon = getRankIcon(entry.rank);
              const isAlternate = index % 2 === 1;

              return (
                <div
                  key={entry.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 transition-colors"
                  style={{
                    backgroundColor: isAlternate
                      ? appliedStyles.rowHoverColor
                      : appliedStyles.backgroundColor,
                    color: isAlternate
                      ? appliedStyles.alternateRowTextColor || appliedStyles.textColor
                      : appliedStyles.textColor,
                  }}
                >
                  {/* Rank */}
                  <div className="col-span-2 flex items-center justify-center">
                    {rankIcon && entry.rank <= 3 ? (
                      <div className="flex items-center gap-2">
                        <Icon name={rankIcon} size={28} style={{ color: rankColor }} />
                        <span className="text-2xl font-bold" style={{ color: rankColor }}>
                          {entry.rank}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-semibold">{entry.rank}</span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="col-span-6 flex items-center">
                    <span className="text-xl md:text-2xl font-medium truncate">{entry.name}</span>
                  </div>

                  {/* Score */}
                  <div className="col-span-4 flex items-center justify-end">
                    <span
                      className="text-xl md:text-2xl font-bold"
                      style={{ color: appliedStyles.accentColor || rankColor }}
                    >
                      {formatScoreDisplay(
                        entry.score,
                        scoreboard.score_type,
                        (scoreboard.time_format as Parameters<typeof formatScoreDisplay>[2]) ?? null
                      )}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {displayEntries.length === 0 && (
              <div className="text-center py-16 text-2xl opacity-50">No entries yet</div>
            )}
          </div>

          {/* "More entries" indicator */}
          {rankedEntries.length > maxEntries && (
            <div
              className="px-6 py-3 text-center text-lg opacity-60"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              +{rankedEntries.length - maxEntries} more entries
            </div>
          )}
        </div>
      </div>

      {/* Footer with timestamp */}
      <div className="flex-shrink-0 mt-4 text-center text-sm opacity-50">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
