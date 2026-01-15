import Icon from '@/components/ui/AppIcon';

interface StatsOverviewProps {
  totalScoreboards: number;
  totalEntries: number;
  activeCompetitions: number;
}

const StatsOverview = ({
  totalScoreboards,
  totalEntries,
  activeCompetitions,
}: StatsOverviewProps) => {
  const stats = [
    {
      label: 'Total Scoreboards',
      value: totalScoreboards,
      icon: 'RectangleStackIcon',
      color: 'text-primary',
      bgColor: 'bg-red-600/10',
    },
    {
      label: 'Total Entries',
      value: totalEntries.toLocaleString(),
      icon: 'UserGroupIcon',
      color: 'text-accent',
      bgColor: 'bg-amber-600/10',
    },
    {
      label: 'Active Competitions',
      value: activeCompetitions,
      icon: 'TrophyIcon',
      color: 'text-warning',
      bgColor: 'bg-yellow-600/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card border border-border rounded-lg p-6 hover:elevation-1 transition-smooth duration-150"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
            </div>
            <div
              className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
            >
              <Icon name={stat.icon} size={24} className={stat.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
