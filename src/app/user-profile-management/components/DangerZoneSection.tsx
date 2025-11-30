'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface DangerZoneSectionProps {
  onDeleteAccount: () => Promise<boolean>;
}

export default function DangerZoneSection({ onDeleteAccount }: DangerZoneSectionProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (confirmText !== 'DELETE') {
      return;
    }

    setDeleting(true);
    await onDeleteAccount();
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setConfirmText('');
  };

  return (
    <div className="bg-card rounded-lg elevation-1 p-6 border-2 border-destructive/30">
      <h2 className="text-xl font-semibold text-destructive mb-2">Danger Zone</h2>
      <p className="text-text-secondary mb-6">
        Once you delete your account, there is no going back. Please be certain.
      </p>

      {!showConfirmation ? (
        <button
          onClick={handleDeleteClick}
          className="px-6 py-3 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-smooth font-medium"
        >
          Delete Account
        </button>
      ) : (
        <div className="space-y-4">
          {/* Warning Message */}
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <div className="flex gap-3">
              <Icon name="ExclamationTriangleIcon" size={24} className="text-destructive flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive mb-2">
                  This action cannot be undone
                </h3>
                <p className="text-sm text-text-primary mb-2">
                  Deleting your account will permanently remove:
                </p>
                <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                  <li>Your profile and personal information</li>
                  <li>All scoreboards you've created</li>
                  <li>All entries associated with your account</li>
                  <li>Access to all features and data</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Type <span className="font-bold text-destructive">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-destructive focus:border-transparent"
              placeholder="Type DELETE here"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleConfirmDelete}
              disabled={confirmText !== 'DELETE' || deleting}
              className="px-6 py-3 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 disabled:bg-muted disabled:text-text-secondary disabled:cursor-not-allowed transition-smooth font-medium"
            >
              {deleting ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
            <button
              onClick={handleCancel}
              disabled={deleting}
              className="px-6 py-3 bg-muted text-text-secondary rounded-lg hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}