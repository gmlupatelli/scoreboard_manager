import Icon from '@/components/ui/AppIcon';
import { ScoreboardCustomStyles, ScoreType, TimeFormat } from '@/types/models';
import { formatScoreDisplay } from '@/utils/timeUtils';

interface EntryCardProps {
  rank: number;
  name: string;
  score: number;
  customStyles?: ScoreboardCustomStyles | null;
  scoreType?: ScoreType;
  timeFormat?: TimeFormat | null;
  index?: number;
}

export default function EntryCard({
  rank,
  name,
  score,
  customStyles,
  scoreType = 'number',
  timeFormat = null,
  index = 0,
}: EntryCardProps) {
  const getPerRankColor = (rank: number): string => {
    if (customStyles) {
      if (rank === 1) return customStyles.rank1Color || '#ca8a04';
      if (rank === 2) return customStyles.rank2Color || '#9ca3af';
      if (rank === 3) return customStyles.rank3Color || '#b45309';
      return customStyles.textColor || '#1f2937';
    }
    if (rank === 1) return '#ca8a04';
    if (rank === 2) return '#9ca3af';
    if (rank === 3) return '#b45309';
    return '#1f2937';
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

  const rankColor = getPerRankColor(rank);
  const rankIconName = getRankIcon(rank);
  const displayScore = formatScoreDisplay(score, scoreType, timeFormat);
  const _scoreIcon = scoreType === 'time' ? 'ClockIcon' : 'StarIcon';

  const isAlternateRow = index % 2 !== 0;
  const textColor = isAlternateRow
    ? customStyles?.alternateRowTextColor || customStyles?.textColor || 'var(--text-primary)'
    : customStyles?.textColor || 'var(--text-primary)';

  return (
    <div
      className="rounded-lg p-4 hover:elevation-1 transition-smooth duration-150"
      style={{
        backgroundColor: isAlternateRow
          ? customStyles?.rowHoverColor || customStyles?.backgroundColor || 'var(--surface)'
          : customStyles?.backgroundColor || 'var(--surface)',
        borderColor: customStyles?.borderColor || 'var(--border)',
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-lg border-2 flex-shrink-0"
            style={{
              backgroundColor: rank <= 3 ? `${rankColor}20` : 'var(--muted)',
              borderColor: rank <= 3 ? rankColor : 'var(--border)',
              color: rankColor,
            }}
          >
            {rankIconName ? (
              <Icon name={rankIconName} size={20} style={{ color: rankColor }} variant="solid" />
            ) : (
              <span className="text-lg font-bold">#{rank}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold truncate" style={{ color: textColor }}>
              {name}
            </h3>
          </div>
        </div>
        <div className="flex items-center flex-shrink-0 ml-4">
          <span
            className="text-xl font-bold"
            style={{ color: customStyles?.accentColor || 'var(--primary)' }}
          >
            {displayScore}
          </span>
        </div>
      </div>
    </div>
  );
}
