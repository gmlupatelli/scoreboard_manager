import Icon from '@/components/ui/AppIcon';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  scoreboardTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal = ({ isOpen, scoreboardTitle, onConfirm, onCancel }: DeleteConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={onCancel} />
      <div className="relative bg-card border border-border rounded-lg p-4 sm:p-6 landscape-mobile:p-3 max-w-[calc(100vw-2rem)] sm:max-w-md w-full mx-4 elevation-3">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Icon name="ExclamationTriangleIcon" size={24} className="text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Delete Scoreboard</h3>
            <p className="text-sm text-text-secondary mb-4">
              Are you sure you want to delete <span className="font-semibold">{scoreboardTitle}</span>? This action cannot be undone and will permanently delete all entries.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-input rounded-md text-sm font-medium text-text-secondary hover:bg-muted transition-smooth"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:opacity-90 transition-smooth"
          >
            Delete Scoreboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;