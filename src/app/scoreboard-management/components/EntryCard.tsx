'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { ScoreType, TimeFormat } from '@/types/models';
import {
  formatScoreDisplay,
  parseTimeToMilliseconds,
  getTimeFormatPlaceholder,
} from '@/utils/timeUtils';

interface Entry {
  id: string;
  rank: number;
  name: string;
  score: number;
}

interface EntryCardProps {
  entry: Entry;
  onEdit: (id: string, name: string, score: number) => void;
  onDelete: (id: string) => void;
  scoreType?: ScoreType;
  timeFormat?: TimeFormat | null;
}

const EntryCard = ({
  entry,
  onEdit,
  onDelete,
  scoreType = 'number',
  timeFormat = null,
}: EntryCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(entry.name);
  const [editScore, setEditScore] = useState(
    scoreType === 'time' && timeFormat
      ? formatScoreDisplay(entry.score, scoreType, timeFormat)
      : entry.score.toString()
  );
  const [nameError, setNameError] = useState('');
  const [scoreError, setScoreError] = useState('');

  const validateName = (value: string): boolean => {
    if (value.length < 1 || value.length > 100) {
      setNameError('Name must be 1-100 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9\s\-']+$/.test(value)) {
      setNameError('Only letters, numbers, spaces, hyphens, and apostrophes allowed');
      return false;
    }
    setNameError('');
    return true;
  };

  const validateScore = (value: string): boolean => {
    if (scoreType === 'number') {
      const numValue = parseInt(value);
      if (isNaN(numValue)) {
        setScoreError('Score must be a valid number');
        return false;
      }
      if (numValue < -1000000 || numValue > 1000000) {
        setScoreError('Score must be between -1,000,000 and 1,000,000');
        return false;
      }
      setScoreError('');
      return true;
    } else {
      if (!timeFormat) {
        setScoreError('Time format not configured');
        return false;
      }
      const ms = parseTimeToMilliseconds(value, timeFormat);
      if (ms === null) {
        setScoreError(`Enter time in format: ${timeFormat}`);
        return false;
      }
      setScoreError('');
      return true;
    }
  };

  const handleSave = () => {
    const isNameValid = validateName(editName);
    const isScoreValid = validateScore(editScore);

    if (isNameValid && isScoreValid) {
      let scoreValue: number;
      if (scoreType === 'number') {
        scoreValue = parseInt(editScore);
      } else {
        scoreValue = parseTimeToMilliseconds(editScore, timeFormat!) || 0;
      }
      onEdit(entry.id, editName, scoreValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(entry.name);
    setEditScore(
      scoreType === 'time' && timeFormat
        ? formatScoreDisplay(entry.score, scoreType, timeFormat)
        : entry.score.toString()
    );
    setNameError('');
    setScoreError('');
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditScore(
      scoreType === 'time' && timeFormat
        ? formatScoreDisplay(entry.score, scoreType, timeFormat)
        : entry.score.toString()
    );
    setIsEditing(true);
  };

  const displayScore = formatScoreDisplay(entry.score, scoreType, timeFormat);
  const scoreLabel = scoreType === 'time' ? 'Time' : 'Score';

  if (isEditing) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 elevation-1">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-text-secondary">Rank #{entry.rank}</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
                validateName(e.target.value);
              }}
              className={`w-full px-3 py-2 border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth duration-150 ${
                nameError ? 'border-destructive' : 'border-input'
              }`}
              placeholder="Enter name"
            />
            {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">{scoreLabel}</label>
            <input
              type={scoreType === 'number' ? 'number' : 'text'}
              value={editScore}
              onChange={(e) => {
                setEditScore(e.target.value);
                validateScore(e.target.value);
              }}
              className={`w-full px-3 py-2 border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth duration-150 ${
                scoreError ? 'border-destructive' : 'border-input'
              }`}
              placeholder={
                scoreType === 'time' && timeFormat
                  ? getTimeFormatPlaceholder(timeFormat)
                  : 'Enter score'
              }
            />
            {scoreError && <p className="text-xs text-destructive mt-1">{scoreError}</p>}
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <button
              onClick={handleSave}
              disabled={!!nameError || !!scoreError}
              className="flex-1 px-4 py-2 rounded-md bg-success text-success-foreground hover:opacity-90 transition-smooth duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 rounded-md bg-muted text-text-secondary hover:bg-muted/80 transition-smooth duration-150 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 elevation-1 hover:elevation-2 transition-smooth duration-150">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text-secondary">Rank #{entry.rank}</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleStartEdit}
            className="p-2 rounded-md text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
            aria-label="Edit entry"
          >
            <Icon name="PencilIcon" size={18} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 rounded-md text-destructive hover:bg-destructive/10 transition-smooth duration-150"
            aria-label="Delete entry"
          >
            <Icon name="TrashIcon" size={18} />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-xs text-text-secondary">Name</p>
          <p className="text-sm font-medium text-text-primary">{entry.name}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">{scoreLabel}</p>
          <p className="text-sm font-data font-medium text-text-primary">{displayScore}</p>
        </div>
      </div>
    </div>
  );
};

export default EntryCard;
