'use client';

import Icon from '@/components/ui/AppIcon';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <Icon name="ExclamationTriangleIcon" size={40} className="text-destructive" />
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">Something Went Wrong</h3>
      <p className="text-text-secondary text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth duration-150 hover-lift"
          title="Try again"
        >
          <Icon name="ArrowPathIcon" size={20} />
          <span className="font-medium">Try Again</span>
        </button>
      )}
    </div>
  );
}
