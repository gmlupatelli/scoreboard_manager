import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface EntryCardProps {
  rank: number;
  name: string;
  score: number;
}

const EntryCard: React.FC<EntryCardProps> = ({ rank, name, score }) => {
  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-muted text-text-secondary border-border';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Icon name="TrophyIcon" size={20} className="text-yellow-600" variant="solid" />;
    if (rank === 2) return <Icon name="TrophyIcon" size={20} className="text-gray-600" variant="solid" />;
    if (rank === 3) return <Icon name="TrophyIcon" size={20} className="text-orange-600" variant="solid" />;
    return null;
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-4 hover:elevation-1 transition-smooth duration-150">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg border-2 ${getRankColor(rank)} flex-shrink-0`}>
            {getRankIcon(rank) || <span className="text-lg font-bold">#{rank}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text-primary truncate">{name}</h3>
            <p className="text-sm text-text-secondary">Rank #{rank}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          <Icon name="StarIcon" size={18} className="text-primary" variant="solid" />
          <span className="text-xl font-bold text-primary">{score.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default EntryCard;