import Icon from '@/components/ui/AppIcon';

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <Icon name="ChartBarIcon" size={48} className="text-muted-foreground" />
      </div>

      <h2 className="text-2xl font-semibold text-text-primary mb-3">No Scoreboards Available</h2>

      <p className="text-text-secondary text-center max-w-md mb-6">
        There are currently no active scoreboards to display. Check back later or contact an
        administrator to create new scoreboards.
      </p>

      <div className="flex items-center space-x-2 text-text-secondary text-sm">
        <Icon name="InformationCircleIcon" size={20} />
        <span>Scoreboards will appear here once created by administrators</span>
      </div>
    </div>
  );
};

export default EmptyState;
