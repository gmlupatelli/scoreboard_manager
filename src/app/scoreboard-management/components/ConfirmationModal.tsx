'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isProcessing?: boolean;
  processingText?: string;
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isProcessing = false,
  processingText,
}: ConfirmationModalProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null;
  }

  if (!isOpen) return null;

  const iconConfig = {
    danger: { name: 'ExclamationTriangleIcon' as const, color: 'text-destructive' },
    warning: { name: 'ExclamationCircleIcon' as const, color: 'text-warning' },
    info: { name: 'InformationCircleIcon' as const, color: 'text-primary' },
  };

  const buttonConfig = {
    danger: 'bg-destructive text-destructive-foreground hover:opacity-90',
    warning: 'bg-warning text-warning-foreground hover:opacity-90',
    info: 'bg-primary text-primary-foreground hover:opacity-90',
  };

  const config = iconConfig[variant];
  const buttonClass = buttonConfig[variant];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[1010]"
        onClick={isProcessing ? undefined : onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-[1011] p-4">
        <div className="bg-card border border-border rounded-lg w-full max-w-md elevation-2">
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className={`flex-shrink-0 ${config.color}`}>
                <Icon name={config.name} size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-secondary">{message}</p>
              </div>
            </div>
            {isProcessing && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary" />
                  <span className="text-sm text-text-secondary">
                    {processingText || 'Processing...'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-1.5 rounded-full animate-pulse w-full" />
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={onConfirm}
                disabled={isProcessing}
                className={`flex-1 px-4 py-2 rounded-md transition-smooth duration-150 font-medium ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                title={confirmText}
              >
                {isProcessing ? processingText || 'Processing...' : confirmText}
              </button>
              {!isProcessing && (
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-md bg-muted text-text-secondary hover:bg-muted/80 transition-smooth duration-150 font-medium"
                  title={cancelText}
                >
                  {cancelText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmationModal;
