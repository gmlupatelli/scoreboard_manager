'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FocusTrap from 'focus-trap-react';
import Icon from '@/components/ui/AppIcon';
import { ScoreType, TimeFormat } from '@/types/models';
import { getTimeFormatLabel } from '@/utils/timeUtils';

interface CreateScoreboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    title: string,
    description: string,
    visibility: 'public' | 'private',
    scoreType: ScoreType,
    sortOrder: 'asc' | 'desc',
    timeFormat: TimeFormat | null
  ) => Promise<{ success: boolean; message: string; scoreboardId?: string }>;
  isSupporter: boolean;
  publicUsage?: {
    used: number;
    max: number;
    remaining: number;
  } | null;
}

const TIME_FORMATS: TimeFormat[] = [
  'hh:mm',
  'hh:mm:ss',
  'mm:ss',
  'mm:ss.s',
  'mm:ss.ss',
  'mm:ss.sss',
];

export default function CreateScoreboardModal({
  isOpen,
  onClose,
  onCreate,
  isSupporter,
  publicUsage,
}: CreateScoreboardModalProps) {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [scoreType, setScoreType] = useState<ScoreType>('number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('mm:ss');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isFreeUser = !isSupporter;
  const isLimitReached =
    isFreeUser && publicUsage?.remaining !== undefined && publicUsage.remaining <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (isLimitReached) {
      setError("You've reached the maximum of 2 public scoreboards on the free plan.");
      return;
    }

    setIsSubmitting(true);
    const result = await onCreate(
      title.trim(),
      description.trim(),
      visibility,
      scoreType,
      sortOrder,
      scoreType === 'time' ? timeFormat : null
    );
    setIsSubmitting(false);

    if (result.success) {
      setTitle('');
      setDescription('');
      setVisibility('public');
      setScoreType('number');
      setSortOrder('desc');
      setTimeFormat('mm:ss');
      onClose();
      if (result.scoreboardId) {
        router.push(`/scoreboard-management?id=${result.scoreboardId}`);
      }
    } else {
      setError(result.message);
    }
  };

  const handleClose = useCallback(() => {
    setTitle('');
    setDescription('');
    setVisibility('public');
    setScoreType('number');
    setSortOrder('desc');
    setTimeFormat('mm:ss');
    setError('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isFreeUser && visibility === 'private') {
      setVisibility('public');
    }
  }, [isFreeUser, visibility]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isHydrated) {
    return null;
  }

  if (!isOpen) return null;

  return (
    <FocusTrap>
      <div>
        <div className="fixed inset-0 bg-black/80 z-[1010]" onClick={handleClose} />
        <div className="fixed inset-0 flex items-center justify-center z-[1011] p-4 pointer-events-none">
          <div
            className="relative bg-card border border-border rounded-lg p-4 sm:p-6 landscape-mobile:p-3 max-w-[calc(100vw-2rem)] sm:max-w-md w-full elevation-3 max-h-[90vh] landscape-mobile:max-h-[95vh] overflow-y-auto pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-scoreboard-title"
          >
            <div className="flex items-center justify-between mb-6 landscape-mobile:mb-3">
              <h2 id="create-scoreboard-title" className="text-xl font-semibold text-text-primary">
                Create New Scoreboard
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 hover:bg-muted rounded-md transition-smooth"
                aria-label="Close modal"
                title="Close modal"
              >
                <Icon name="XMarkIcon" size={24} className="text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 landscape-mobile:space-y-2">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-text-primary mb-2"
                  >
                    Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter scoreboard title"
                    disabled={isSubmitting}
                  />
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
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Enter optional description"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Visibility
                  </label>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="public"
                        checked={visibility === 'public'}
                        onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                        className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring"
                        disabled={isSubmitting}
                      />
                      <span className="ml-2 text-sm text-text-primary flex items-center">
                        <Icon name="GlobeAltIcon" size={16} className="mr-1" />
                        Public
                      </span>
                    </label>
                    <label
                      className={`flex items-center ${isFreeUser ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <input
                        type="radio"
                        value="private"
                        checked={visibility === 'private'}
                        onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                        className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring"
                        disabled={isSubmitting || isFreeUser}
                      />
                      <span className="ml-2 text-sm text-text-primary flex items-center">
                        <Icon name="LockClosedIcon" size={16} className="mr-1" />
                        Private
                        {isFreeUser && (
                          <span
                            className="ml-2 text-xs text-text-secondary flex items-center gap-1"
                            title="Supporter feature"
                          >
                            <Icon name="LockClosedIcon" size={12} />
                            Supporter feature
                          </span>
                        )}
                      </span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    {visibility === 'public'
                      ? 'Anyone can view this scoreboard'
                      : 'Only you or someone with the scoreboard link can view this scoreboard'}
                  </p>
                  {isFreeUser && publicUsage && (
                    <p className="mt-2 text-xs text-text-secondary">
                      You have used {publicUsage.used} of {publicUsage.max} public scoreboards.
                    </p>
                  )}
                  {isLimitReached && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                      <p className="font-medium">Limit reached</p>
                      <p className="mt-1">Become a Supporter for unlimited scoreboards.</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-medium text-text-primary mb-3">Score Settings</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Score Type
                      </label>
                      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="number"
                            checked={scoreType === 'number'}
                            onChange={() => setScoreType('number')}
                            className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring"
                            disabled={isSubmitting}
                          />
                          <span className="ml-2 text-sm text-text-primary flex items-center">
                            <Icon name="HashtagIcon" size={16} className="mr-1" />
                            Number
                          </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="time"
                            checked={scoreType === 'time'}
                            onChange={() => setScoreType('time')}
                            className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring"
                            disabled={isSubmitting}
                          />
                          <span className="ml-2 text-sm text-text-primary flex items-center">
                            <Icon name="ClockIcon" size={16} className="mr-1" />
                            Time
                          </span>
                        </label>
                      </div>
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
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                          disabled={isSubmitting}
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
                      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="desc"
                            checked={sortOrder === 'desc'}
                            onChange={() => setSortOrder('desc')}
                            className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring"
                            disabled={isSubmitting}
                          />
                          <span className="ml-2 text-sm text-text-primary flex items-center">
                            <Icon name="ArrowDownIcon" size={16} className="mr-1" />
                            {scoreType === 'time' ? 'Slowest First' : 'Highest First'}
                          </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="asc"
                            checked={sortOrder === 'asc'}
                            onChange={() => setSortOrder('asc')}
                            className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring"
                            disabled={isSubmitting}
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

                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                    <Icon name="ExclamationTriangleIcon" size={20} className="text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-input rounded-md text-sm font-medium text-text-secondary hover:bg-muted transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  disabled={isSubmitting}
                  title="Cancel and close"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isLimitReached}
                  className="w-full py-2 px-4 bg-primary text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary transition-colors duration-150"
                  title={
                    isLimitReached ? 'Public scoreboard limit reached' : 'Create new scoreboard'
                  }
                >
                  {isSubmitting ? 'Creating...' : 'Create Scoreboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}
