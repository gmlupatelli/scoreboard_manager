import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface ScoreboardCardProps {
  id: string;
  title: string;
  description: string;
  slug: string;
  entryCount: number;
}

const ScoreboardCard = ({
  id,
  title,
  description,
  slug: _slug,
  entryCount,
}: ScoreboardCardProps) => {
  return (
    <article className="bg-card border border-border rounded-lg p-6 hover:elevation-2 transition-smooth duration-150 hover-lift">
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-xl font-semibold text-text-primary line-clamp-2">{title}</h2>
          <div className="flex items-center space-x-1 text-text-secondary ml-2 flex-shrink-0">
            <Icon name="UserGroupIcon" size={18} />
            <span className="text-sm font-medium">{entryCount}</span>
          </div>
        </div>

        <p className="text-text-secondary text-sm mb-4 line-clamp-3 flex-grow">{description}</p>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center space-x-2 text-text-secondary text-xs">
            <Icon name="ChartBarIcon" size={16} />
            <span>Live Rankings</span>
          </div>

          <Link
            href={`/individual-scoreboard-view?id=${id}`}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-smooth duration-150 hover-lift"
            aria-label={`View ${title} scoreboard`}
          >
            <span>View Scoreboard</span>
            <Icon name="ArrowRightIcon" size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default ScoreboardCard;
