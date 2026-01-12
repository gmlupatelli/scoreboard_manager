'use client';

import Icon from '@/components/ui/AppIcon';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface InvitationCardProps {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  onCancel?: () => void;
  onAccept?: () => void;
  canSwipe?: boolean;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'accepted':
      return 'bg-success/10 text-success border-success/20';
    case 'expired':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'cancelled':
      return 'bg-muted text-text-secondary border-border';
    default:
      return 'bg-muted text-text-secondary border-border';
  }
};

export default function InvitationCard({
  id: _id,
  email,
  status,
  createdAt,
  expiresAt,
  onCancel,
  onAccept,
  canSwipe = false,
}: InvitationCardProps) {
  const { ref: swipeRef, swipeState } = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: status === 'pending' && onCancel ? onCancel : undefined,
    onSwipeRight: status === 'pending' && onAccept ? onAccept : undefined,
    disabled: !canSwipe || status !== 'pending',
  });

  const getSwipeBackground = () => {
    if (!swipeState.isSwiping) return undefined;

    if (swipeState.direction === 'left') {
      return `rgba(220, 38, 38, ${swipeState.progress * 0.2})`; // Destructive color
    } else if (swipeState.direction === 'right') {
      return `rgba(34, 197, 94, ${swipeState.progress * 0.2})`; // Success color
    }
    return undefined;
  };

  const getSwipeTransform = () => {
    if (!swipeState.isSwiping || !swipeState.direction) return undefined;

    const maxTranslate = 100;
    const translate =
      swipeState.progress * maxTranslate * (swipeState.direction === 'left' ? -1 : 1);
    return `translateX(${translate}px)`;
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-border">
      {/* Swipe background indicator */}
      {swipeState.isSwiping && (
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity"
          style={{
            backgroundColor: getSwipeBackground(),
          }}
        >
          <Icon
            name={swipeState.direction === 'left' ? 'XMarkIcon' : 'CheckIcon'}
            size={32}
            className={`${
              swipeState.direction === 'left' ? 'text-destructive' : 'text-success'
            } transition-transform`}
            style={{
              opacity: swipeState.progress,
              transform: `scale(${0.5 + swipeState.progress * 0.5})`,
            }}
          />
        </div>
      )}

      {/* Card content */}
      <div
        ref={swipeRef}
        className="relative bg-surface p-4 transition-transform"
        style={{
          transform: getSwipeTransform(),
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name="UserIcon" size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-primary truncate">{email}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-text-secondary mt-1">
                <span className="flex items-center gap-1">
                  <Icon name="CalendarIcon" size={14} className="flex-shrink-0" />
                  <span className="truncate">Sent {new Date(createdAt).toLocaleDateString()}</span>
                </span>
                <span className="hidden sm:inline text-border">|</span>
                <span className="flex items-center gap-1">
                  <Icon name="ClockIcon" size={14} className="flex-shrink-0" />
                  <span className="truncate">
                    Expires {new Date(expiresAt).toLocaleDateString()}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize border ${getStatusColor(
                status
              )}`}
            >
              {status}
            </span>
            {status === 'pending' && onCancel && (
              <button
                onClick={onCancel}
                className="p-2 rounded-md text-text-secondary hover:text-destructive hover:bg-destructive/10 transition-smooth duration-150"
                title="Cancel invitation"
                aria-label="Cancel invitation"
              >
                <Icon name="XMarkIcon" size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
