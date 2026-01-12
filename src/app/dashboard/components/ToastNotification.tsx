import { useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

const ToastNotification = ({ message, type, isVisible, onClose }: ToastNotificationProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }[type];

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
  }[type];

  const iconName = {
    success: 'CheckCircleIcon',
    error: 'XCircleIcon',
    info: 'InformationCircleIcon',
  }[type];

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div
        className={`${bgColor} ${textColor} border rounded-lg p-4 flex items-center space-x-3 elevation-2 min-w-[300px]`}
      >
        <Icon name={iconName} size={24} />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button onClick={onClose} className="hover:opacity-70 transition-smooth">
          <Icon name="XMarkIcon" size={20} />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;
