'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ScoreboardCardProps {
  id: string;
  title: string;
  description: string;
  entryCount: number;
  createdAt: string;
  ownerName?: string;
  visibility?: 'public' | 'private';
  isLocked?: boolean;
  canUnlock?: boolean;
  onUnlock?: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: () => void;
  onNavigate: (id: string) => void;
  onExport?: (id: string) => void;
  isExporting?: boolean;
}

const ScoreboardCard = ({
  id,
  title,
  description,
  entryCount,
  createdAt,
  ownerName,
  visibility = 'public',
  isLocked = false,
  canUnlock = false,
  onUnlock,
  onRename,
  onDelete,
  onNavigate,
  onExport,
  isExporting = false,
}: ScoreboardCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [showMenu, setShowMenu] = useState(false);

  const handleRename = () => {
    if (editedTitle.trim() && editedTitle !== title) {
      onRename(id, editedTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border"
      data-testid="scoreboard-card"
    >
      {/* Card content */}
      <div className="relative bg-card p-6 hover-lift flex flex-col h-full">
        {isLocked && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-700">
              <Icon name="LockClosedIcon" size={14} />
              Read-only
            </span>
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleRename}
              onKeyPress={(e) => e.key === 'Enter' && handleRename()}
              className="flex-1 px-2 py-1 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          ) : (
            <h3 className="text-lg font-semibold text-text-primary flex-1">{title}</h3>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-muted rounded-md transition-smooth"
              aria-label="More options"
              title="More options"
            >
              <Icon name="EllipsisVerticalIcon" size={20} className="text-text-secondary" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-md elevation-2 z-20">
                  {!isLocked && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth"
                      title="Rename scoreboard"
                    >
                      <Icon name="PencilIcon" size={18} className="mr-3" />
                      Rename
                    </button>
                  )}
                  {onExport && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExport(id);
                        setShowMenu(false);
                      }}
                      disabled={isExporting}
                      className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Export scoreboard to CSV"
                    >
                      <Icon name="DocumentArrowDownIcon" size={18} className="mr-3" />
                      {isExporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-red-500/10 transition-smooth"
                    title="Delete scoreboard"
                  >
                    <Icon name="TrashIcon" size={18} className="mr-3" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="h-12 mb-4">
          {description ? (
            <p className="text-sm text-text-secondary line-clamp-2">{description}</p>
          ) : (
            <p className="text-sm text-text-secondary line-clamp-2 italic">
              No description available
            </p>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex flex-col gap-2 mb-4">
          {ownerName && (
            <div className="flex items-center space-x-1 text-sm text-text-secondary">
              <Icon name="UserIcon" size={20} />
              <span className="truncate">{ownerName}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <div className="flex items-center space-x-1">
              <Icon name={visibility === 'public' ? 'GlobeAltIcon' : 'LockClosedIcon'} size={20} />
              <span>{visibility === 'public' ? 'Public' : 'Private'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="UsersIcon" size={20} />
              <span>{entryCount} entries</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="CalendarIcon" size={20} />
              <span>{createdAt}</span>
            </div>
          </div>
        </div>

        {isLocked && canUnlock && onUnlock && (
          <button
            onClick={onUnlock}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-primary rounded-md font-medium text-sm hover:bg-red-600/10 transition-colors duration-150"
            title="Unlock this scoreboard"
          >
            <Icon name="LockClosedIcon" size={18} />
            <span>Unlock Scoreboard</span>
          </button>
        )}

        <button
          onClick={() => onNavigate(id)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
          title="Manage this scoreboard"
        >
          <span>Manage Scoreboard</span>
          <Icon name="ArrowRightIcon" size={18} />
        </button>
      </div>
    </div>
  );
};

export default ScoreboardCard;
