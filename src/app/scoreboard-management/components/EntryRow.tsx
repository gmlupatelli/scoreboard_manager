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

interface EntryRowProps {
  entry: Entry;
  onEdit: (id: string, name: string, score: number) => void;
  onDelete: (id: string) => void;
  scoreType?: ScoreType;
  timeFormat?: TimeFormat | null;
  isReadOnly?: boolean;
}

const EntryRow = ({
  entry,
  onEdit,
  onDelete,
  scoreType = 'number',
  timeFormat = null,
  isReadOnly = false,
}: EntryRowProps) => {
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

  if (isEditing) {
    return (
      <tr className="hover:bg-muted/50 transition-smooth duration-150">
        <td className="px-4 py-3 text-sm font-medium text-text-primary">{entry.rank}</td>
        <td className="px-4 py-3">
          <div>
            <input
              type="text"
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
                validateName(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !nameError && !scoreError) {
                  handleSave();
                }
              }}
              className={`w-full px-3 py-2 border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth duration-150 ${
                nameError ? 'border-destructive' : 'border-input'
              }`}
              placeholder="Enter name"
            />
            {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
          </div>
        </td>
        <td className="px-4 py-3">
          <div>
            <input
              type={scoreType === 'number' ? 'number' : 'text'}
              value={editScore}
              onChange={(e) => {
                setEditScore(e.target.value);
                validateScore(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !nameError && !scoreError) {
                  handleSave();
                }
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
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!!nameError || !!scoreError}
              className="p-2 rounded-md bg-success text-success-foreground hover:opacity-90 transition-smooth duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save changes"
              title="Save changes"
            >
              <Icon name="CheckIcon" size={20} />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 rounded-md bg-muted text-text-secondary hover:bg-muted/80 transition-smooth duration-150"
              aria-label="Cancel editing"
              title="Cancel editing"
            >
              <Icon name="XMarkIcon" size={20} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-muted/50 transition-smooth duration-150">
      <td className="px-4 py-3 text-sm font-medium text-text-primary">{entry.rank}</td>
      <td className="px-4 py-3 text-sm text-text-primary">{entry.name}</td>
      <td className="px-4 py-3 text-sm font-data text-text-primary">{displayScore}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={handleStartEdit}
            disabled={isReadOnly}
            className={`p-2 rounded-md transition-smooth duration-150 ${
              isReadOnly
                ? 'text-text-secondary/40 cursor-not-allowed'
                : 'text-text-secondary hover:bg-muted hover:text-text-primary'
            }`}
            aria-label="Edit entry"
            title={
              isReadOnly
                ? 'Editing is disabled on locked/private scoreboards (Free plan)'
                : 'Edit entry'
            }
          >
            <Icon name="PencilIcon" size={20} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="p-2 rounded-md text-destructive hover:bg-red-500/10 transition-smooth duration-150"
            aria-label="Delete entry"
            title="Delete entry"
          >
            <Icon name="TrashIcon" size={20} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default EntryRow;
