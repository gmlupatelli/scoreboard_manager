'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import DowngradeNoticeManager from '@/components/common/DowngradeNoticeManager';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DowngradeNoticeManager />
      {children}
    </AuthProvider>
  );
}
