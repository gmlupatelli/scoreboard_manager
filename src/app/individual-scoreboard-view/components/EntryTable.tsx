import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { ScoreboardCustomStyles } from '@/types/models';

interface Entry {
  id: string | number;
  rank: number;
  name: string;
  score: number;
}

interface EntryTableProps {
  entries: Entry[];
  customStyles?: ScoreboardCustomStyles | null;
}

const EntryTable: React.FC<EntryTableProps> = ({ entries, customStyles }) => {
  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'text-yellow-600';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-700';
    return 'text-text-primary';
  };

  const getRankIcon = (rank: number): string | null => {
    if (rank === 1) return 'TrophyIcon';
    if (rank === 2) return 'TrophyIcon';
    if (rank === 3) return 'TrophyIcon';
    return null;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead style={{ backgroundColor: customStyles?.headerColor || 'var(--muted)' }}>
          <tr>
            <th 
              className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider w-20"
              style={{ color: customStyles?.headerTextColor || 'var(--text-secondary)' }}
            >
              Rank
            </th>
            <th 
              className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
              style={{ color: customStyles?.headerTextColor || 'var(--text-secondary)' }}
            >
              Name
            </th>
            <th 
              className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider w-32"
              style={{ color: customStyles?.headerTextColor || 'var(--text-secondary)' }}
            >
              Score
            </th>
          </tr>
        </thead>
        <tbody style={{ backgroundColor: customStyles?.backgroundColor || 'var(--surface)' }}>
          {entries?.map?.((entry, index) => {
            const rankIcon = getRankIcon(entry?.rank || 0);
            const rankColor = customStyles ? undefined : getRankColor(entry?.rank || 0);

            return (
              <tr 
                key={entry?.id} 
                className="transition-colors"
                style={{ 
                  backgroundColor: index % 2 === 0 
                    ? (customStyles?.backgroundColor || 'var(--surface)')
                    : (customStyles?.rowHoverColor || 'var(--muted)'),
                  borderBottom: `1px solid ${customStyles?.borderColor || 'var(--border)'}`,
                }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div 
                    className={`flex items-center space-x-2 font-semibold ${rankColor || ''}`}
                    style={customStyles ? { color: customStyles.textColor } : undefined}
                  >
                    {rankIcon && <Icon name={rankIcon} size={20} style={customStyles && entry.rank <= 3 ? { color: customStyles.rankHighlightColor } : undefined} />}
                    <span className="text-sm">#{entry?.rank}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span 
                    className="text-sm font-medium"
                    style={{ color: customStyles?.textColor || 'var(--text-primary)' }}
                  >
                    {entry?.name || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span 
                    className="text-sm font-semibold"
                    style={{ color: customStyles?.accentColor || 'var(--primary)' }}
                  >
                    {entry?.score?.toLocaleString?.() || '0'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EntryTable;