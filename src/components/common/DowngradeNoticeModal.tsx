'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

type DowngradeNoticeMode = 'cancelled' | 'expired';

interface DowngradeNoticeModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  mode?: DowngradeNoticeMode;
}

export default function DowngradeNoticeModal({
  isOpen,
  onDismiss,
  mode = 'expired',
}: DowngradeNoticeModalProps) {
  if (!isOpen) return null;

  const title = mode === 'cancelled' ? 'Your plan is scheduled to end' : 'Your plan has ended';
  const description =
    mode === 'cancelled'
      ? 'Your plan stays active until the end of the current billing cycle. After that, your account switches to the Free plan and all scoreboards are locked. Public boards can be unlocked up to your free limit. Private boards remain locked.'
      : 'Your account is now on the Free plan. We locked all scoreboards to keep your data safe. Public boards can be unlocked up to your free limit. Private boards remain locked.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="downgrade-notice-overlay">
      <div className="bg-surface rounded-lg shadow-lg max-w-md w-full mx-4 p-6" data-testid="downgrade-notice-modal">
        <div className="flex items-start gap-3 mb-4">
          <Icon name="LockClosedIcon" size={24} className="text-warning flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <p className="text-text-secondary text-sm mt-1">{description}</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800 font-medium">Free plan limits</p>
          <ul className="list-disc list-inside text-sm text-amber-800 mt-2 space-y-1">
            <li>2 public scoreboards maximum</li>
            <li>Private scoreboards are locked</li>
            <li>50 entries per scoreboard maximum</li>
            <li>Preset themes only</li>
            <li>Powered by badge on embeds</li>
            <li>Kiosk / TV Mode disabled</li>
          </ul>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-muted text-text-primary rounded-md font-medium text-sm hover:opacity-90 transition-colors duration-150"
            title="Dismiss"
            data-testid="downgrade-notice-dismiss"
          >
            Dismiss
          </button>
          <Link
            href="/supporter-plan"
            className="px-4 py-2 bg-primary text-white rounded-md font-medium text-sm hover:bg-red-700 transition-colors duration-150"
            title="Become a Supporter Again"
          >
            Become a Supporter Again
          </Link>
        </div>
      </div>
    </div>
  );
}
