'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { QueuedToast } from '@/hooks/useUndoQueue';

interface UndoToastProps {
  toast: QueuedToast;
  onUndo: () => void;
  onDismiss: () => void;
  index: number;
}

export default function UndoToast({ toast, onUndo, onDismiss, index }: UndoToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  // Slide in animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Progress bar countdown
  useEffect(() => {
    const duration = toast.expiresAt - Date.now();
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.expiresAt]);

  const handleUndo = () => {
    setIsVisible(false);
    setTimeout(onUndo, 200);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className={`
        fixed z-[9999] left-1/2 -translate-x-1/2 w-full max-w-md px-4
        transition-all duration-200 ease-smooth
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
      style={{
        bottom: `${1 + index * 4.5}rem`,
      }}
    >
      <div className="bg-card border border-border rounded-lg shadow-elevation-2 overflow-hidden">
        <div className="flex items-center justify-between p-3 gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Icon
              name={toast.isBatch ? 'QueueListIcon' : 'InformationCircleIcon'}
              size={20}
              className="text-primary flex-shrink-0"
            />
            <span className="text-sm text-text-primary font-medium truncate">
              {toast.isBatch ? `Undo ${toast.batchCount} actions` : toast.message}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleUndo}
              className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
              aria-label="Undo action"
            >
              Undo
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-muted rounded-md transition-smooth"
              aria-label="Dismiss toast"
            >
              <Icon name="XMarkIcon" size={16} className="text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-50 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
