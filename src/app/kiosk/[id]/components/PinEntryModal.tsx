'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface PinEntryModalProps {
  scoreboardId: string;
  onVerified: () => void;
  onCancel: () => void;
}

export default function PinEntryModal({ scoreboardId, onVerified, onCancel }: PinEntryModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    try {
      const response = await fetch(`/api/kiosk/public/${scoreboardId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid PIN');
      }

      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setPin(numericValue);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="LockClosedIcon" size={32} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">PIN Protected</h2>
          <p className="text-gray-400">Enter the PIN to access this kiosk</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              placeholder="Enter PIN"
              className="w-full px-6 py-4 text-2xl text-center tracking-widest bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              autoFocus
              disabled={isVerifying}
            />
            {error && <p className="mt-3 text-red-400 text-center text-sm">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 transition-colors"
              disabled={isVerifying}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isVerifying || pin.length === 0}
            >
              {isVerifying ? 'Verifying...' : 'Enter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
