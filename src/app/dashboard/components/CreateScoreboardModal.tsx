import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface CreateScoreboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, subtitle: string, visibility: 'public' | 'private') => Promise<{ success: boolean; message: string }>;
}

const CreateScoreboardModal = ({ isOpen, onClose, onCreate }: CreateScoreboardModalProps) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    const result = await onCreate(title.trim(), subtitle.trim(), visibility);
    setIsSubmitting(false);

    if (result.success) {
      setTitle('');
      setSubtitle('');
      setVisibility('public');
      onClose();
    } else {
      setError(result.message);
    }
  };

  const handleClose = () => {
    setTitle('');
    setSubtitle('');
    setVisibility('public');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 elevation-3">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Create New Scoreboard</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted rounded-md transition-smooth"
            aria-label="Close modal"
          >
            <Icon name="XMarkIcon" size={24} className="text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-2">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter scoreboard title"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="subtitle" className="block text-sm font-medium text-text-primary mb-2">
                Subtitle
              </label>
              <textarea
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Enter optional description"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Visibility</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                    className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-text-secondary">Public</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                    className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-text-secondary">Private</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <Icon name="ExclamationTriangleIcon" size={20} className="text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-input rounded-md text-sm font-medium text-text-secondary hover:bg-muted transition-smooth"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-smooth disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Scoreboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateScoreboardModal;