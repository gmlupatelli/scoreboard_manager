import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { ScoreboardCustomStyles } from '@/types/models';

interface EntryCardProps {
  rank: number;
  name: string;
  score: number;
  customStyles?: ScoreboardCustomStyles | null;
}

const EntryCard: React.FC<EntryCardProps> = ({ rank, name, score, customStyles }) => {
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

  return (
    <div 
      className="rounded-lg p-4 hover:elevation-1 transition-smooth duration-150"
      style={{
        backgroundColor: customStyles?.backgroundColor || 'var(--surface)',
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
            <h3 
              className="text-base font-semibold truncate"
              style={{ color: customStyles?.textColor || 'var(--text-primary)' }}
            >
              {name}
            </h3>
            <p 
              className="text-sm"
              style={{ color: customStyles?.textColor ? `${customStyles.textColor}99` : 'var(--text-secondary)' }}
            >
              Rank #{rank}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          <Icon name="StarIcon" size={18} style={{ color: customStyles?.accentColor || 'var(--primary)' }} variant="solid" />
          <span 
            className="text-xl font-bold"
            style={{ color: customStyles?.accentColor || 'var(--primary)' }}
          >
            {score.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EntryCard;