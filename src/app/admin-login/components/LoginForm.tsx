'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface LoginFormProps {
  onSubmit: (password: string) => Promise<{ success: boolean; message: string }>;
}

const LoginForm = ({ onSubmit }: LoginFormProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitMessage, setRateLimitMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card border border-border rounded-lg elevation-2 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-6"></div>
            <div className="h-10 bg-muted rounded mb-4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRateLimitMessage('');

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmit(password);
      
      if (result.success) {
        router.push('/admin-dashboard');
      } else {
        if (result.message.includes('rate limit')) {
          setRateLimitMessage(result.message);
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError('');
    if (rateLimitMessage) setRateLimitMessage('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border border-border rounded-lg elevation-2 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Icon name="LockClosedIcon" size={32} className="text-primary-foreground" variant="solid" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Admin Login</h1>
          <p className="text-sm text-text-secondary">Enter your password to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 pr-12 border rounded-md bg-surface text-text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-smooth duration-150 ${
                  error || rateLimitMessage ? 'border-destructive' : 'border-input'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Enter admin password"
                autoComplete="current-password"
                aria-invalid={!!error || !!rateLimitMessage}
                aria-describedby={error || rateLimitMessage ? 'password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-text-primary transition-smooth duration-150"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={20} />
              </button>
            </div>
            {error && (
              <p id="password-error" className="mt-2 text-sm text-destructive flex items-start" role="alert">
                <Icon name="ExclamationCircleIcon" size={16} className="mr-1 mt-0.5 flex-shrink-0" variant="solid" />
                <span>{error}</span>
              </p>
            )}
            {rateLimitMessage && (
              <p id="password-error" className="mt-2 text-sm text-warning flex items-start" role="alert">
                <Icon name="ClockIcon" size={16} className="mr-1 mt-0.5 flex-shrink-0" variant="solid" />
                <span>{rateLimitMessage}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !password.trim()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-smooth duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin">
                  <Icon name="ArrowPathIcon" size={20} />
                </div>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <Icon name="ArrowRightOnRectangleIcon" size={20} />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-center space-x-2 text-xs text-text-secondary">
            <Icon name="ShieldCheckIcon" size={16} className="text-success" variant="solid" />
            <span>Secured with SSL encryption</span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-text-secondary">
          Mock Credentials: <span className="font-data text-text-primary">admin123</span>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;