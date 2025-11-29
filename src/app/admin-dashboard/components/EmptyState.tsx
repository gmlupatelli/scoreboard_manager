import Icon from '@/components/ui/AppIcon';

interface EmptyStateProps {
  onCreateNew: () => void;
}

const EmptyState = ({ onCreateNew }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Icon name="ClipboardDocumentListIcon" size={32} className="text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">No Scoreboards Yet</h3>
      <p className="text-sm text-text-secondary text-center max-w-md mb-6">
        Get started by creating your first scoreboard to track and manage competition entries.
      </p>
      <button
        onClick={onCreateNew}
        className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth hover-lift"
      >
        <Icon name="PlusIcon" size={20} />
        <span>Create Your First Scoreboard</span>
      </button>
    </div>
  );
};

export default EmptyState;