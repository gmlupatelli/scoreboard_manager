import Icon from '@/components/ui/AppIcon';
import { ScoreboardCustomStyles, ScoreType, TimeFormat } from '@/types/models';
import { formatScoreDisplay } from '@/utils/timeUtils';

interface Entry {
  id: string | number;
  rank: number;
  name: string;
  score: number;
}

interface EntryTableProps {
  entries: Entry[];
  customStyles?: ScoreboardCustomStyles | null;
  scoreType?: ScoreType;
  timeFormat?: TimeFormat | null;
}

export default function EntryTable({
  entries,
  customStyles,
  scoreType = 'number',
  timeFormat = null,
}: EntryTableProps) {
  const getRankColor = (rank: number): string | undefined => {
    if (customStyles) {
      if (rank === 1) return customStyles.rank1Color || '#ca8a04';
      if (rank === 2) return customStyles.rank2Color || '#9ca3af';
      if (rank === 3) return customStyles.rank3Color || '#b45309';
      return customStyles.textColor;
    }
    if (rank === 1) return '#ca8a04';
    if (rank === 2) return '#9ca3af';
    if (rank === 3) return '#b45309';
    return undefined;
  };

  const getRankIcon = (rank: number): string | null => {
    if (customStyles) {
      if (rank === 1) return customStyles.rank1Icon || 'TrophyIcon';
      if (rank === 2) return customStyles.rank2Icon || 'TrophyIcon';
      if (rank === 3) return customStyles.rank3Icon || 'TrophyIcon';
    }
    if (rank <= 3) return 'TrophyIcon';
    return null;
  };

  const scoreLabel = scoreType === 'time' ? 'Time' : 'Score';

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
              {scoreLabel}
            </th>
          </tr>
        </thead>
        <tbody style={{ backgroundColor: customStyles?.backgroundColor || 'var(--surface)' }}>
          {entries?.map?.((entry, index) => {
            const rankIcon = getRankIcon(entry?.rank || 0);
            const rankColor = getRankColor(entry?.rank || 0);
            const isAlternateRow = index % 2 !== 0;
            const textColor = isAlternateRow
              ? customStyles?.alternateRowTextColor ||
                customStyles?.textColor ||
                'var(--text-primary)'
              : customStyles?.textColor || 'var(--text-primary)';

            return (
              <tr
                key={entry?.id}
                className="transition-colors"
                style={{
                  backgroundColor:
                    index % 2 === 0
                      ? customStyles?.backgroundColor || 'var(--surface)'
                      : customStyles?.rowHoverColor || 'var(--muted)',
                  borderBottom: `1px solid ${customStyles?.borderColor || 'var(--border)'}`,
                }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="flex items-center space-x-2 font-semibold"
                    style={{ color: rankColor || textColor }}
                  >
                    {rankIcon && <Icon name={rankIcon} size={20} style={{ color: rankColor }} />}
                    <span className="text-sm">#{entry?.rank}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium" style={{ color: textColor }}>
                    {entry?.name || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: customStyles?.accentColor || 'var(--primary)' }}
                  >
                    {formatScoreDisplay(entry?.score || 0, scoreType, timeFormat)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
