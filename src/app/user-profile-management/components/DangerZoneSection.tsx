'use client';

import { useState } from 'react';

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
    // Note: If successful, user will be redirected, so no need to reset state
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setConfirmText('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-red-200">
      <h2 className="text-xl font-semibold text-red-600 mb-2">Danger Zone</h2>
      <p className="text-gray-600 mb-6">
        Once you delete your account, there is no going back. Please be certain.
      </p>

      {!showConfirmation ? (
        <button
          onClick={handleDeleteClick}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Delete Account
        </button>
      ) : (
        <div className="space-y-4">
          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">
                  This action cannot be undone
                </h3>
                <p className="text-sm text-red-800 mb-2">
                  Deleting your account will permanently remove:
                </p>
                <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Type DELETE here"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleConfirmDelete}
              disabled={confirmText !== 'DELETE' || deleting}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {deleting ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
            <button
              onClick={handleCancel}
              disabled={deleting}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}