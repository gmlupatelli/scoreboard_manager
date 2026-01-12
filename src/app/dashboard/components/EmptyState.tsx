import Icon from '@/components/ui/AppIcon';

interface EmptyStateProps {
  onCreateNew: () => void;
}

const EmptyState = ({ onCreateNew }: EmptyStateProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-12 text-center">
      <Icon
        name="ClipboardDocumentListIcon"
        size={64}
        className="text-muted-foreground mx-auto mb-4"
      />
      <h3 className="text-xl font-semibold text-text-primary mb-2">No Scoreboards Yet</h3>
      <p className="text-text-secondary mb-6 max-w-md mx-auto">
        Get started by creating your first scoreboard to track competitions and rankings.
      </p>
      <button
        onClick={onCreateNew}
        className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth hover-lift"
      >
        <Icon name="PlusIcon" size={20} />
        <span>Create First Scoreboard</span>
      </button>
    </div>
  );
};

export default EmptyState;
