'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Icon from '@/components/ui/AppIcon';

interface ConfirmationConfig {
  title: string;
  message: string;
  icon: string;
  iconColor: string;
  redirectPath: string;
  redirectLabel: string;
  autoRedirect: boolean;
  redirectDelay: number;
}

const confirmationTypes: Record<string, ConfirmationConfig> = {
  signup: {
    title: 'Email Confirmed!',
    message: 'Your email has been verified successfully. You can now access all features of your account.',
    icon: 'CheckCircleIcon',
    iconColor: 'text-green-500',
    redirectPath: '/dashboard',
    redirectLabel: 'Go to Dashboard',
    autoRedirect: true,
    redirectDelay: 5,
  },
  email_change: {
    title: 'Email Updated!',
    message: 'Your email address has been changed successfully. Your account is now using your new email.',
    icon: 'CheckCircleIcon',
    iconColor: 'text-green-500',
    redirectPath: '/user-profile-management',
    redirectLabel: 'Go to Profile',
    autoRedirect: true,
    redirectDelay: 5,
  },
  generic: {
    title: 'Confirmed!',
    message: 'Your action has been confirmed successfully.',
    icon: 'CheckCircleIcon',
    iconColor: 'text-green-500',
    redirectPath: '/dashboard',
    redirectLabel: 'Go to Dashboard',
    autoRedirect: true,
    redirectDelay: 5,
  },
  error: {
    title: 'Verification Failed',
    message: 'We could not verify your request. The link may have expired or already been used. Please try again or request a new confirmation email.',
    icon: 'ExclamationCircleIcon',
    iconColor: 'text-red-500',
    redirectPath: '/login',
    redirectLabel: 'Go to Login',
    autoRedirect: false,
    redirectDelay: 0,
  },
};

export default function EmailConfirmedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState<number | null>(null);

  const type = searchParams.get('type') || 'generic';
  const config = confirmationTypes[type] || confirmationTypes.generic;

  useEffect(() => {
    if (config.autoRedirect) {
      setCountdown(config.redirectDelay);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            router.push(config.redirectPath);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [config.autoRedirect, config.redirectDelay, config.redirectPath, router]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border rounded-lg p-8 text-center shadow-sm">
            <div className="mb-6">
              <Icon 
                name={config.icon} 
                size={64} 
                className={`mx-auto ${config.iconColor}`} 
              />
            </div>
            
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              {config.title}
            </h1>
            
            <p className="text-text-secondary mb-8">
              {config.message}
            </p>

            {config.autoRedirect && countdown !== null && countdown > 0 && (
              <p className="text-sm text-muted-foreground mb-6">
                Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            )}

            <Link
              href={config.redirectPath}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
            >
              <span>{config.redirectLabel}</span>
              <Icon name="ArrowRightIcon" size={16} />
            </Link>

            {type === 'error' && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-text-secondary mb-3">
                  Need help?
                </p>
                <Link
                  href="/support"
                  className="text-primary hover:underline text-sm"
                >
                  Contact Support
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
