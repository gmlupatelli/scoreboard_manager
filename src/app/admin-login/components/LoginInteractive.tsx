'use client';

import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import SecurityBadges from './SecurityBadges';

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning';
  message: string;
}

const LoginInteractive = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg elevation-2 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-3/4 mb-6 mx-auto"></div>
              <div className="h-10 bg-muted rounded mb-4"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const MOCK_ADMIN_PASSWORD = 'admin123';
  const RATE_LIMIT_WINDOW = 60000; // 1 minute
  const MAX_ATTEMPTS = 30;

  const showToast = (type: ToastMessage['type'], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const handleLogin = async (password: string): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentTime = Date.now();

        // Rate limiting check
        if (currentTime - lastAttemptTime < RATE_LIMIT_WINDOW) {
          if (attemptCount >= MAX_ATTEMPTS) {
            const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - (currentTime - lastAttemptTime)) / 1000);
            const message = `Rate limit exceeded. Please try again in ${remainingTime} seconds.`;
            showToast('warning', message);
            resolve({ success: false, message });
            return;
          }
        } else {
          setAttemptCount(0);
          setLastAttemptTime(currentTime);
        }

        setAttemptCount((prev) => prev + 1);

        // Password validation
        if (password === MOCK_ADMIN_PASSWORD) {
          showToast('success', 'Login successful! Redirecting to dashboard...');
          resolve({ success: true, message: 'Login successful' });
        } else {
          const message = 'Invalid password. Please try again. (Hint: Use "admin123")';
          showToast('error', message);
          resolve({ success: false, message });
        }
      }, 800);
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-6xl">
          <LoginForm onSubmit={handleLogin} />
          <SecurityBadges />
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[1100] space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-start space-x-3 px-4 py-3 rounded-md elevation-2 min-w-[320px] max-w-md animate-slide-in ${
                toast.type === 'success' ?'bg-success text-success-foreground'
                  : toast.type === 'error' ?'bg-destructive text-destructive-foreground' :'bg-warning text-warning-foreground'
              }`}
              role="alert"
            >
              <div className="flex-shrink-0 mt-0.5">
                {toast.type === 'success' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {toast.type === 'warning' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <p className="text-sm font-medium flex-1">{toast.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoginInteractive;