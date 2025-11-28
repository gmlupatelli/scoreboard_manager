'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, score: number) => void;
}

const AddEntryModal = ({ isOpen, onClose, onAdd }: AddEntryModalProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [name, setName] = useState('');
  const [score, setScore] = useState('');
  const [nameError, setNameError] = useState('');
  const [scoreError, setScoreError] = useState('');

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setScore('');
      setNameError('');
      setScoreError('');
    }
  }, [isOpen]);

  if (!isHydrated) {
    return null;
  }

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isNameValid = validateName(name);
    const isScoreValid = validateScore(score);

    if (isNameValid && isScoreValid) {
      onAdd(name, parseInt(score));
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[1010]" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-[1011] p-4">
        <div className="bg-card border border-border rounded-lg w-full max-w-md elevation-2">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">Add New Entry</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
              aria-label="Close modal"
            >
              <Icon name="XMarkIcon" size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="entry-name" className="block text-sm font-medium text-text-primary mb-2">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                id="entry-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  validateName(e.target.value);
                }}
                className={`w-full px-3 py-2 border rounded-md bg-surface text-text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth duration-150 ${
                  nameError ? 'border-destructive' : 'border-input'
                }`}
                placeholder="Enter participant name"
              />
              {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
              <p className="text-xs text-text-secondary mt-1">1-100 characters (letters, numbers, spaces, hyphens, apostrophes)</p>
            </div>
            <div>
              <label htmlFor="entry-score" className="block text-sm font-medium text-text-primary mb-2">
                Score <span className="text-destructive">*</span>
              </label>
              <input
                id="entry-score"
                type="number"
                value={score}
                onChange={(e) => {
                  setScore(e.target.value);
                  validateScore(e.target.value);
                }}
                className={`w-full px-3 py-2 border rounded-md bg-surface text-text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth duration-150 ${
                  scoreError ? 'border-destructive' : 'border-input'
                }`}
                placeholder="Enter score"
              />
              {scoreError && <p className="text-xs text-destructive mt-1">{scoreError}</p>}
              <p className="text-xs text-text-secondary mt-1">Integer between -1,000,000 and 1,000,000</p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={!!nameError || !!scoreError || !name || !score}
                className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-smooth duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Add Entry
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-md bg-muted text-text-secondary hover:bg-muted/80 transition-smooth duration-150 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddEntryModal;