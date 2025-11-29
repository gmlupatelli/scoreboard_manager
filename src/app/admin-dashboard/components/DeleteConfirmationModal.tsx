'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  scoreboardTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal = ({ isOpen, scoreboardTitle, onConfirm, onCancel }: DeleteConfirmationModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = () => {
    setIsDeleting(true);
    onConfirm();
    setTimeout(() => {
      setIsDeleting(false);
    }, 400);
  };

  const handleCancel = () => {
    if (!isDeleting) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-lg w-full max-w-md elevation-2">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-destructive/10 rounded-full">
            <Icon name="ExclamationTriangleIcon" size={24} className="text-destructive" />
          </div>

          <h2 className="text-xl font-semibold text-text-primary text-center mb-2">Delete Scoreboard</h2>
          <p className="text-sm text-text-secondary text-center mb-6">
            Are you sure you want to delete <span className="font-semibold text-text-primary">{scoreboardTitle}</span>?
            This action cannot be undone and will permanently delete all entries.
          </p>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleCancel}
              disabled={isDeleting}
              className="px-4 py-2 border border-border rounded-md text-text-secondary hover:bg-muted transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
            >
              {isDeleting ? 'Deleting...' : 'Delete Scoreboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;