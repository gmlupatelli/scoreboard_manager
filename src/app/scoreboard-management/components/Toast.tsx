'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type, isVisible, onClose, duration = 3000 }: ToastProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isVisible && isHydrated) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration, isHydrated]);

  if (!isHydrated) {
    return null;
  }

  if (!isVisible) return null;

  const config = {
    success: {
      icon: 'CheckCircleIcon' as const,
      bgColor: 'bg-success',
      textColor: 'text-success-foreground'
    },
    error: {
      icon: 'XCircleIcon' as const,
      bgColor: 'bg-destructive',
      textColor: 'text-destructive-foreground'
    },
    info: {
      icon: 'InformationCircleIcon' as const,
      bgColor: 'bg-primary',
      textColor: 'text-primary-foreground'
    }
  };

  const { icon, bgColor, textColor } = config[type];

  return (
    <div className="fixed bottom-4 right-4 z-[1020] animate-in slide-in-from-bottom-5">
      <div className={`${bgColor} ${textColor} rounded-lg elevation-2 px-4 py-3 flex items-center space-x-3 min-w-[300px] max-w-md`}>
        <Icon name={icon} size={20} />
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-80 transition-smooth duration-150"
          aria-label="Close notification"
        >
          <Icon name="XMarkIcon" size={18} />
        </button>
      </div>
    </div>
  );
};

export default Toast;