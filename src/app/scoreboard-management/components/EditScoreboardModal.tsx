'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { ScoreType, TimeFormat } from '@/types/models';
import { getTimeFormatLabel } from '@/utils/timeUtils';

interface EditScoreboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    title: string,
    description: string,
    visibility: 'public' | 'private',
    scoreType: ScoreType,
    sortOrder: 'asc' | 'desc',
    timeFormat: TimeFormat | null,
    scoreTypeChanged: boolean
  ) => void;
  currentTitle: string;
  currentDescription: string;
  currentVisibility: 'public' | 'private';
  currentScoreType: ScoreType;
  currentSortOrder: 'asc' | 'desc';
  currentTimeFormat: TimeFormat | null;
  entryCount: number;
}

const TIME_FORMATS: TimeFormat[] = [
  'hh:mm',
  'hh:mm:ss',
  'mm:ss',
  'mm:ss.s',
  'mm:ss.ss',
  'mm:ss.sss',
];

const EditScoreboardModal = ({
  isOpen,
  onClose,
  onSave,
  currentTitle,
  currentDescription,
  currentVisibility,
  currentScoreType,
  currentSortOrder,
  currentTimeFormat,
  entryCount,
}: EditScoreboardModalProps) => {
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription);
  const [visibility, setVisibility] = useState<'public' | 'private'>(currentVisibility);
  const [scoreType, setScoreType] = useState<ScoreType>(currentScoreType);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(currentSortOrder);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(currentTimeFormat || 'mm:ss');
  const [errors, setErrors] = useState({ title: '', description: '' });
  const [showTypeChangeConfirm, setShowTypeChangeConfirm] = useState(false);
  const [_pendingSubmit, setPendingSubmit] = useState(false);

  const scoreTypeChanged = scoreType !== currentScoreType;

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setDescription(currentDescription);
      setVisibility(currentVisibility);
      setScoreType(currentScoreType);
      setSortOrder(currentSortOrder);
      setTimeFormat(currentTimeFormat || 'mm:ss');
      setErrors({ title: '', description: '' });
      setShowTypeChangeConfirm(false);
      setPendingSubmit(false);
    }
  }, [
    isOpen,
    currentTitle,
    currentDescription,
    currentVisibility,
    currentScoreType,
    currentSortOrder,
    currentTimeFormat,
  ]);

  const validateForm = () => {
    const newErrors = { title: '', description: '' };
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

    if (description.trim().length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (scoreTypeChanged && entryCount > 0) {
      setShowTypeChangeConfirm(true);
      setPendingSubmit(true);
      return;
    }

    doSave();
  };

  const doSave = () => {
    onSave(
      title.trim(),
      description.trim(),
      visibility,
      scoreType,
      sortOrder,
      scoreType === 'time' ? timeFormat : null,
      scoreTypeChanged
    );
    onClose();
  };

  const handleConfirmTypeChange = () => {
    setShowTypeChangeConfirm(false);
    doSave();
  };

  const handleCancelTypeChange = () => {
    setShowTypeChangeConfirm(false);
    setPendingSubmit(false);
    setScoreType(currentScoreType);
    setTimeFormat(currentTimeFormat || 'mm:ss');
  };

  const handleClose = () => {
    setTitle(currentTitle);
    setDescription(currentDescription);
    setVisibility(currentVisibility);
    setScoreType(currentScoreType);
    setSortOrder(currentSortOrder);
    setTimeFormat(currentTimeFormat || 'mm:ss');
    setErrors({ title: '', description: '' });
    setShowTypeChangeConfirm(false);
    setPendingSubmit(false);
    onClose();
  };

  if (!isOpen) return null;

  if (showTypeChangeConfirm) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

          <div className="relative w-full max-w-md transform rounded-lg bg-card border border-border shadow-xl transition-all">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center space-x-2">
                <Icon name="ExclamationTriangleIcon" size={24} className="text-warning" />
                <h3 className="text-lg font-semibold text-text-primary">
                  Confirm Score Type Change
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-text-primary">
                Changing the score type from{' '}
                <strong>{currentScoreType === 'number' ? 'Number' : 'Time'}</strong> to{' '}
                <strong>{scoreType === 'number' ? 'Number' : 'Time'}</strong> will{' '}
                <span className="text-destructive font-semibold">
                  permanently delete all {entryCount} entries
                </span>{' '}
                from this scoreboard.
              </p>
              <p className="text-text-secondary text-sm">
                This action cannot be undone. Are you sure you want to continue?
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
              <button
                type="button"
                onClick={handleCancelTypeChange}
                className="px-4 py-2 rounded-md border border-input text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
                title="Cancel type change"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTypeChange}
                className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-smooth duration-150"
                title="Delete all entries and change type"
              >
                Delete Entries & Change Type
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />

        <div className="relative w-full max-w-md transform rounded-lg bg-card border border-border shadow-xl transition-all max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-text-primary">Edit Scoreboard Details</h3>
            <button
              onClick={handleClose}
              className="rounded-md p-1 hover:bg-muted transition-smooth duration-150"
              title="Close modal"
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
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.description ? 'border-destructive' : 'border-input'
                } bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-smooth duration-150 resize-none`}
                placeholder="Enter scoreboard description (optional)"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-destructive">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Visibility</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    className="w-4 h-4 text-primary border-input focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-text-primary flex items-center">
                    <Icon name="GlobeAltIcon" size={16} className="mr-1" />
                    Public
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                    className="w-4 h-4 text-primary border-input focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-text-primary flex items-center">
                    <Icon name="LockClosedIcon" size={16} className="mr-1" />
                    Private
                  </span>
                </label>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                {visibility === 'public'
                  ? 'Anyone can view this scoreboard'
                  : 'Only you can view this scoreboard'}
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-text-primary mb-3">Score Settings</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Score Type
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="scoreType"
                        value="number"
                        checked={scoreType === 'number'}
                        onChange={() => setScoreType('number')}
                        className="w-4 h-4 text-primary border-input focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-text-primary flex items-center">
                        <Icon name="HashtagIcon" size={16} className="mr-1" />
                        Number
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="scoreType"
                        value="time"
                        checked={scoreType === 'time'}
                        onChange={() => setScoreType('time')}
                        className="w-4 h-4 text-primary border-input focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-text-primary flex items-center">
                        <Icon name="ClockIcon" size={16} className="mr-1" />
                        Time
                      </span>
                    </label>
                  </div>
                  {scoreTypeChanged && entryCount > 0 && (
                    <p className="mt-1 text-xs text-warning flex items-center">
                      <Icon name="ExclamationTriangleIcon" size={14} className="mr-1" />
                      Changing score type will delete all {entryCount} entries
                    </p>
                  )}
                </div>

                {scoreType === 'time' && (
                  <div>
                    <label
                      htmlFor="timeFormat"
                      className="block text-sm font-medium text-text-primary mb-2"
                    >
                      Time Format
                    </label>
                    <select
                      id="timeFormat"
                      value={timeFormat}
                      onChange={(e) => setTimeFormat(e.target.value as TimeFormat)}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text-primary"
                    >
                      {TIME_FORMATS.map((format) => (
                        <option key={format} value={format}>
                          {getTimeFormatLabel(format)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Sort Order
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="sortOrder"
                        value="desc"
                        checked={sortOrder === 'desc'}
                        onChange={() => setSortOrder('desc')}
                        className="w-4 h-4 text-primary border-input focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-text-primary flex items-center">
                        <Icon name="ArrowDownIcon" size={16} className="mr-1" />
                        {scoreType === 'time' ? 'Slowest First' : 'Highest First'}
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="sortOrder"
                        value="asc"
                        checked={sortOrder === 'asc'}
                        onChange={() => setSortOrder('asc')}
                        className="w-4 h-4 text-primary border-input focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-text-primary flex items-center">
                        <Icon name="ArrowUpIcon" size={16} className="mr-1" />
                        {scoreType === 'time' ? 'Fastest First' : 'Lowest First'}
                      </span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    {sortOrder === 'desc'
                      ? scoreType === 'time'
                        ? 'Entries with longer times appear first'
                        : 'Entries with higher scores appear first'
                      : scoreType === 'time'
                        ? 'Entries with faster times appear first'
                        : 'Entries with lower scores appear first'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-md border border-input text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
                title="Cancel changes"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-smooth duration-150"
                title="Save changes"
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
