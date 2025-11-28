'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface CreateScoreboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string) => void;
}

const CreateScoreboardModal = ({ isOpen, onClose, onCreate }: CreateScoreboardModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { title?: string; description?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && !isSubmitting) {
      setIsSubmitting(true);
      onCreate(title.trim(), description.trim());
      setTimeout(() => {
        setTitle('');
        setDescription('');
        setErrors({});
        setIsSubmitting(false);
        onClose();
      }, 400);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle('');
      setDescription('');
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-lg w-full max-w-md elevation-2">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">Create New Scoreboard</h2>
          <button
            onClick={handleClose}
            className="p-1 text-muted-foreground hover:bg-muted rounded transition-smooth"
            aria-label="Close"
          >
            <Icon name="XMarkIcon" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-smooth ${
                errors.title ? 'border-destructive' : 'border-input'
              }`}
              placeholder="Enter scoreboard title"
              maxLength={100}
            />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-smooth resize-none ${
                errors.description ? 'border-destructive' : 'border-input'
              }`}
              placeholder="Enter scoreboard description (optional)"
              rows={4}
              maxLength={500}
            />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
            <p className="text-xs text-text-secondary mt-1">{description.length}/500 characters</p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-border rounded-md text-text-secondary hover:bg-muted transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
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