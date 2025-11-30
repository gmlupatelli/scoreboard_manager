import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface Entry {
  id: string | number;
  rank: number;
  name: string;
  score: number;
}

interface EntryTableProps {
  entries: Entry[];
}

const EntryTable: React.FC<EntryTableProps> = ({ entries }) => {
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
        <thead className="bg-muted">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-20">
              Rank
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-4 text-right text-xs font-medium text-text-secondary uppercase tracking-wider w-32">
              Score
            </th>
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-border">
          {entries?.map?.((entry) => {
            const rankIcon = getRankIcon(entry?.rank || 0);
            const rankColor = getRankColor(entry?.rank || 0);

            return (
              <tr key={entry?.id} className="hover:bg-muted transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center space-x-2 font-semibold ${rankColor}`}>
                    {rankIcon && <Icon name={rankIcon} size={20} />}
                    <span className="text-sm">#{entry?.rank}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-text-primary">{entry?.name || 'Unknown'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-semibold text-primary">
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