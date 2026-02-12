'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { ScoreType, TimeFormat } from '@/types/models';
import { parseTimeToMilliseconds, formatScoreDisplay } from '@/utils/timeUtils';

interface CSVEntry {
  name: string;
  score: number;
  isValid: boolean;
  error?: string;
}

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (entries: { name: string; score: number }[]) => Promise<void> | void;
  scoreType?: ScoreType;
  timeFormat?: TimeFormat | null;
}

const ImportCSVModal = ({
  isOpen,
  onClose,
  onImport,
  scoreType = 'number',
  timeFormat = null,
}: ImportCSVModalProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [previewEntries, setPreviewEntries] = useState<CSVEntry[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setCsvContent('');
      setPreviewEntries([]);
      setShowPreview(false);
      setValidCount(0);
      setInvalidCount(0);
    }
  }, [isOpen]);

  if (!isHydrated) {
    return null;
  }

  if (!isOpen) return null;

  const validateEntry = (
    name: string,
    scoreStr: string
  ): { isValid: boolean; score: number; error?: string } => {
    if (name.length < 1 || name.length > 100) {
      return { isValid: false, score: 0, error: 'Name must be 1-100 characters' };
    }
    if (!/^[a-zA-Z0-9\s\-']+$/.test(name)) {
      return { isValid: false, score: 0, error: 'Invalid characters in name' };
    }

    if (scoreType === 'number') {
      const numScore = parseInt(scoreStr);
      if (isNaN(numScore)) {
        return { isValid: false, score: 0, error: 'Score must be a number' };
      }
      if (numScore < -1000000 || numScore > 1000000) {
        return { isValid: false, score: 0, error: 'Score out of range' };
      }
      return { isValid: true, score: numScore };
    } else {
      if (!timeFormat) {
        return { isValid: false, score: 0, error: 'Time format not configured' };
      }
      const ms = parseTimeToMilliseconds(scoreStr.trim(), timeFormat);
      if (ms === null) {
        return { isValid: false, score: 0, error: `Invalid time format (expected ${timeFormat})` };
      }
      return { isValid: true, score: ms };
    }
  };

  const handlePreview = () => {
    const lines = csvContent.trim().split('\n');
    const entries: CSVEntry[] = [];
    let valid = 0;
    let invalid = 0;

    lines.forEach((line, index) => {
      if (
        index === 0 &&
        (line.toLowerCase().includes('name') ||
          line.toLowerCase().includes('score') ||
          line.toLowerCase().includes('time'))
      ) {
        return;
      }

      const [name, scoreStr] = line.split(',').map((s) => s.trim());
      if (!name || !scoreStr) {
        entries.push({
          name: name || '',
          score: 0,
          isValid: false,
          error: 'Missing name or score',
        });
        invalid++;
        return;
      }

      const validation = validateEntry(name, scoreStr);
      entries.push({
        name,
        score: validation.score,
        isValid: validation.isValid,
        error: validation.error,
      });

      if (validation.isValid) {
        valid++;
      } else {
        invalid++;
      }
    });

    setPreviewEntries(entries);
    setValidCount(valid);
    setInvalidCount(invalid);
    setShowPreview(true);
  };

  const handleImport = async () => {
    const validEntries = previewEntries
      .filter((entry) => entry.isValid)
      .map((entry) => ({ name: entry.name, score: entry.score }));

    if (validEntries.length > 0) {
      setIsImporting(true);
      try {
        await onImport(validEntries);
      } finally {
        setIsImporting(false);
      }
      onClose();
    }
  };

  const scoreLabel = scoreType === 'time' ? 'Time' : 'Score';
  const exampleFormat =
    scoreType === 'time' && timeFormat
      ? `John Doe, ${timeFormat === 'mm:ss' ? '5:30' : timeFormat === 'hh:mm:ss' ? '1:30:45' : '5:30.5'}`
      : 'John Doe, 1500';
  const formatDescription =
    scoreType === 'time' && timeFormat
      ? `Times: ${timeFormat} format`
      : 'Scores: Number between -1,000,000 and 1,000,000';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[1010]" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-[1011] p-4">
        <div className="bg-card border border-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden elevation-2 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">Import CSV</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
              aria-label="Close modal"
              title="Close modal"
            >
              <Icon name="XMarkIcon" size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {!showPreview ? (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="csv-content"
                    className="block text-sm font-medium text-text-primary mb-2"
                  >
                    CSV Content
                  </label>
                  <textarea
                    id="csv-content"
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    className="w-full h-64 px-3 py-2 border border-input rounded-md bg-surface text-text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth duration-150 font-data text-sm"
                    placeholder={
                      exampleFormat + '\nJane Smith, ' + (scoreType === 'time' ? '6:15' : '1450')
                    }
                  />
                  <p className="text-xs text-text-secondary mt-2">
                    Format: Name, {scoreLabel} (one entry per line)
                  </p>
                </div>
                <div className="bg-muted/50 border border-border rounded-md p-4">
                  <h3 className="text-sm font-medium text-text-primary mb-2">
                    CSV Format Requirements:
                  </h3>
                  <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                    <li>Each line should contain: Name, {scoreLabel}</li>
                    <li>
                      Names: 1-100 characters (letters, numbers, spaces, hyphens, apostrophes)
                    </li>
                    <li>{formatDescription}</li>
                    <li>Optional header row will be automatically skipped</li>
                  </ul>
                </div>
                <button
                  onClick={handlePreview}
                  disabled={!csvContent.trim()}
                  className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-smooth duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  title="Preview CSV import"
                >
                  Preview Import
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span className="text-sm text-text-secondary">Valid: {validCount}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-destructive" />
                      <span className="text-sm text-text-secondary">Invalid: {invalidCount}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-sm text-primary hover:underline"
                    title="Go back and edit CSV"
                  >
                    Edit CSV
                  </button>
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            {scoreLabel}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-surface divide-y divide-border">
                        {previewEntries.map((entry, index) => (
                          <tr key={index} className={entry.isValid ? '' : 'bg-red-500/5'}>
                            <td className="px-4 py-3">
                              {entry.isValid ? (
                                <Icon name="CheckCircleIcon" size={18} className="text-success" />
                              ) : (
                                <Icon name="XCircleIcon" size={18} className="text-destructive" />
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-text-primary">{entry.name}</td>
                            <td className="px-4 py-3 text-sm font-data text-text-primary">
                              {entry.isValid
                                ? formatScoreDisplay(entry.score, scoreType, timeFormat)
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-xs text-destructive">
                              {entry.error || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleImport}
                    disabled={validCount === 0 || isImporting}
                    className="flex-1 px-4 py-2 rounded-md bg-success text-success-foreground hover:opacity-90 transition-smooth duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    title="Import valid entries"
                  >
                    {isImporting
                      ? `Importing ${validCount} ${validCount === 1 ? 'entry' : 'entries'}...`
                      : `Import ${validCount} Valid ${validCount === 1 ? 'Entry' : 'Entries'}`}
                  </button>
                  {!isImporting && (
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2 rounded-md bg-muted text-text-secondary hover:bg-muted/80 transition-smooth duration-150 font-medium"
                      title="Cancel import"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {isImporting && (
                  <div className="mt-3">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full animate-pulse"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <p className="text-xs text-text-secondary mt-1 text-center">
                      Importing entries, please wait...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ImportCSVModal;
