'use client';

import { useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const ToastNotification = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 3000,
}: ToastNotificationProps) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: 'bg-success text-success-foreground',
    error: 'bg-destructive text-destructive-foreground',
    info: 'bg-primary text-primary-foreground',
  };

  const icons = {
    success: 'CheckCircleIcon',
    error: 'XCircleIcon',
    info: 'InformationCircleIcon',
  };

  return (
    <div className="fixed top-20 right-4 z-[1001] animate-in slide-in-from-right duration-300">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg elevation-2 ${typeStyles[type]}`}>
        <Icon name={icons[type] as any} size={20} />
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 hover:opacity-80 transition-smooth"
          aria-label="Close notification"
        >
          <Icon name="XMarkIcon" size={18} />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;