'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { Scoreboard } from '../../../types/models';

interface PublicScoreboardCardProps {
  scoreboard: Scoreboard;
}

const PublicScoreboardCard = ({ scoreboard }: PublicScoreboardCardProps) => {
  const router = useRouter();

  const handleView = () => {
    router.push(`/individual-scoreboard-view?id=${scoreboard.id}`);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:elevation-1 transition-smooth duration-150 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-text-primary truncate">{scoreboard.title}</h3>
        </div>
      </div>

      <div className="h-12 mb-4">
        <p
          className={`text-sm text-text-secondary line-clamp-2 ${!scoreboard.description ? 'italic' : ''}`}
        >
          {scoreboard.description || 'No description available'}
        </p>
      </div>

      <div className="flex-1" />

      <div className="flex items-center justify-between text-sm text-text-secondary mb-4">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <Icon name="ListBulletIcon" size={16} className="mr-1" />
            {scoreboard.entryCount || 0} {scoreboard.entryCount === 1 ? 'entry' : 'entries'}
          </span>
          <span className="flex items-center">
            <Icon name="CalendarIcon" size={16} className="mr-1" />
            {new Date(scoreboard.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <button
        onClick={handleView}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth hover-lift"
        title="View this scoreboard"
      >
        <Icon name="EyeIcon" size={18} />
        <span>View Scoreboard</span>
      </button>
    </div>
  );
};

export default PublicScoreboardCard;
