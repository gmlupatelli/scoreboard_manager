'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface EditScoreboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, subtitle: string) => void;
  currentTitle: string;
  currentSubtitle: string;
}

const EditScoreboardModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentTitle, 
  currentSubtitle 
}: EditScoreboardModalProps) => {
  const [title, setTitle] = useState(currentTitle);
  const [subtitle, setSubtitle] = useState(currentSubtitle);
  const [errors, setErrors] = useState({ title: '', subtitle: '' });

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setSubtitle(currentSubtitle);
      setErrors({ title: '', subtitle: '' });
    }
  }, [isOpen, currentTitle, currentSubtitle]);

  const validateForm = () => {
    const newErrors = { title: '', subtitle: '' };
    let isValid = true;

    if (!title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
      isValid = false;
    } else if (title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
      isValid = false;
    }

    if (subtitle.trim().length > 200) {
      newErrors.subtitle = 'Description must be less than 200 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(title.trim(), subtitle.trim());
      onClose();
    }
  };

  const handleClose = () => {
    setTitle(currentTitle);
    setSubtitle(currentSubtitle);
    setErrors({ title: '', subtitle: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />
        
        <div className="relative w-full max-w-md transform rounded-lg bg-card border border-border shadow-xl transition-all">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-text-primary">Edit Scoreboard Details</h3>
            <button
              onClick={handleClose}
              className="rounded-md p-1 hover:bg-muted transition-smooth duration-150"
            >
              <Icon name="XMarkIcon" size={20} className="text-text-secondary" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-2">
                Scoreboard Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.title ? 'border-destructive' : 'border-input'
                } bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-smooth duration-150`}
                placeholder="Enter scoreboard title"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="subtitle" className="block text-sm font-medium text-text-primary mb-2">
                Description
              </label>
              <textarea
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.subtitle ? 'border-destructive' : 'border-input'
                } bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-smooth duration-150 resize-none`}
                placeholder="Enter scoreboard description (optional)"
              />
              {errors.subtitle && (
                <p className="mt-1 text-xs text-destructive">{errors.subtitle}</p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-md border border-input text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-smooth duration-150"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditScoreboardModal;