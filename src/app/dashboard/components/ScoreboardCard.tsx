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
  onRename: (id: string, newTitle: string) => void;
  onDelete: () => void;
  onNavigate: (id: string) => void;
}

const ScoreboardCard = ({
  id,
  title,
  description,
  entryCount,
  createdAt,
  ownerName,
  visibility = 'public',
  onRename,
  onDelete,
  onNavigate,
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
    <div className="bg-card border border-border rounded-lg p-6 hover-lift relative flex flex-col h-full">
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
          >
            <Icon name="EllipsisVerticalIcon" size={20} className="text-text-secondary" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-md elevation-2 z-20">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth"
                >
                  <Icon name="PencilIcon" size={18} className="mr-3" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
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

      <div className="h-12 mb-4">
        {description ? (
          <p className="text-sm text-text-secondary line-clamp-2">{description}</p>
        ) : (
          <p className="text-sm text-text-secondary line-clamp-2 italic">No description available</p>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-2 mb-4">
        {ownerName && (
          <div className="flex items-center space-x-1 text-sm text-text-secondary">
            <Icon name="UserIcon" size={16} />
            <span className="truncate">{ownerName}</span>
          </div>
        )}
        <div className="flex items-center space-x-4 text-sm text-text-secondary">
          <div className="flex items-center space-x-1">
            <Icon name={visibility === 'public' ? 'GlobeAltIcon' : 'LockClosedIcon'} size={16} />
            <span>{visibility === 'public' ? 'Public' : 'Private'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="UsersIcon" size={16} />
            <span>{entryCount} entries</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="CalendarIcon" size={16} />
            <span>{createdAt}</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onNavigate(id)}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
      >
        <span>Manage Scoreboard</span>
        <Icon name="ArrowRightIcon" size={18} />
      </button>
    </div>
  );
};

export default ScoreboardCard;