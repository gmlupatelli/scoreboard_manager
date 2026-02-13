'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import DowngradeNoticeManager from '@/components/common/DowngradeNoticeManager';
import PaymentWarningBanner from '@/components/common/PaymentWarningBanner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PaymentWarningBanner />
      <DowngradeNoticeManager />
      {children}
    </AuthProvider>
  );
}
