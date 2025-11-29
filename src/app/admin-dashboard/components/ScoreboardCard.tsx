'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ScoreboardCardProps {
  id: string;
  title: string;
  description: string;
  entryCount: number;
  createdAt: string;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
}

const ScoreboardCard = ({
  id,
  title,
  description,
  entryCount,
  createdAt,
  onRename,
  onDelete,
  onNavigate,
}: ScoreboardCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newTitle !== title) {
      onRename(id, newTitle.trim());
    }
    setIsRenaming(false);
    setIsMenuOpen(false);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDelete(id);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:elevation-1 transition-smooth duration-150">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="flex items-center space-x-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 px-3 py-1 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
                maxLength={100}
              />
              <button
                type="submit"
                className="p-1 text-success hover:bg-success/10 rounded transition-smooth"
                aria-label="Save"
              >
                <Icon name="CheckIcon" size={20} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRenaming(false);
                  setNewTitle(title);
                }}
                className="p-1 text-muted-foreground hover:bg-muted rounded transition-smooth"
                aria-label="Cancel"
              >
                <Icon name="XMarkIcon" size={20} />
              </button>
            </form>
          ) : (
            <h3 className="text-lg font-semibold text-text-primary truncate">{title}</h3>
          )}
          <p className="text-sm text-text-secondary mt-1 line-clamp-2">{description}</p>
        </div>
        <div className="relative ml-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-muted-foreground hover:bg-muted rounded-md transition-smooth"
            aria-label="More options"
          >
            <Icon name="EllipsisVerticalIcon" size={20} />
          </button>
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-md elevation-2 z-20">
                <button
                  onClick={() => {
                    setIsRenaming(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:bg-muted transition-smooth"
                >
                  <Icon name="PencilIcon" size={18} className="mr-3" />
                  Rename
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-smooth"
                >
                  <Icon name="TrashIcon" size={18} className="mr-3" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-text-secondary mb-4">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <Icon name="ListBulletIcon" size={16} className="mr-1" />
            {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
          </span>
          <span className="flex items-center">
            <Icon name="CalendarIcon" size={16} className="mr-1" />
            {createdAt}
          </span>
        </div>
      </div>

      <button
        onClick={() => onNavigate(id)}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth hover-lift"
      >
        <Icon name="ArrowRightIcon" size={18} />
        <span>Manage Scoreboard</span>
      </button>
    </div>
  );
};

export default ScoreboardCard;