'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

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
}

const EntryRow = ({ entry, onEdit, onDelete }: EntryRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(entry.name);
  const [editScore, setEditScore] = useState(entry.score.toString());
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
  };

  const handleSave = () => {
    const isNameValid = validateName(editName);
    const isScoreValid = validateScore(editScore);

    if (isNameValid && isScoreValid) {
      onEdit(entry.id, editName, parseInt(editScore));
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(entry.name);
    setEditScore(entry.score.toString());
    setNameError('');
    setScoreError('');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr className="border-b border-border hover:bg-muted/50 transition-smooth duration-150">
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
              type="number"
              value={editScore}
              onChange={(e) => {
                setEditScore(e.target.value);
                validateScore(e.target.value);
              }}
              className={`w-full px-3 py-2 border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth duration-150 ${
                scoreError ? 'border-destructive' : 'border-input'
              }`}
              placeholder="Enter score"
            />
            {scoreError && <p className="text-xs text-destructive mt-1">{scoreError}</p>}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={!!nameError || !!scoreError}
              className="p-2 rounded-md bg-success text-success-foreground hover:opacity-90 transition-smooth duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save changes"
            >
              <Icon name="CheckIcon" size={18} />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 rounded-md bg-muted text-text-secondary hover:bg-muted/80 transition-smooth duration-150"
              aria-label="Cancel editing"
            >
              <Icon name="XMarkIcon" size={18} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-smooth duration-150">
      <td className="px-4 py-3 text-sm font-medium text-text-primary">{entry.rank}</td>
      <td className="px-4 py-3 text-sm text-text-primary">{entry.name}</td>
      <td className="px-4 py-3 text-sm font-data text-text-primary">{entry.score.toLocaleString()}</td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(true)}
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
      </td>
    </tr>
  );
};

export default EntryRow;