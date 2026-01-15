'use client';

import Icon from '@/components/ui/AppIcon';

interface InvitationCardProps {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  onCancel?: () => void;
  onAccept?: () => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/10 text-warning border-yellow-500/20';
    case 'accepted':
      return 'bg-green-500/10 text-success border-green-500/20';
    case 'expired':
      return 'bg-red-500/10 text-destructive border-red-500/20';
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
  onAccept: _onAccept,
}: InvitationCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border"
      data-testid="invitation-card"
    >
      {/* Card content */}
      <div className="relative bg-surface p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-red-600/10 flex items-center justify-center flex-shrink-0">
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
                className="p-2 rounded-md text-text-secondary hover:text-destructive hover:bg-red-500/10 transition-smooth duration-150"
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
