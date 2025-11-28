import ScoreboardCard from './ScoreboardCard';

interface Scoreboard {
  id: string;
  title: string;
  description: string;
  slug: string;
  entryCount: number;
}

interface ScoreboardGridProps {
  scoreboards: Scoreboard[];
}

const ScoreboardGrid = ({ scoreboards }: ScoreboardGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scoreboards.map((scoreboard) => (
        <ScoreboardCard
          key={scoreboard.id}
          id={scoreboard.id}
          title={scoreboard.title}
          description={scoreboard.description}
          slug={scoreboard.slug}
          entryCount={scoreboard.entryCount}
        />
      ))}
    </div>
  );
};

export default ScoreboardGrid;