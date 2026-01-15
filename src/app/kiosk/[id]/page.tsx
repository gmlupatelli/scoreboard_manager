import type { Metadata } from 'next';
import { Suspense } from 'react';
import KioskViewInteractive from './components/KioskViewInteractive';

export const metadata: Metadata = {
  title: 'Kiosk View - Scoreboard Manager',
  description:
    'Full-screen TV-optimized display for scoreboard rankings with automatic carousel rotation.',
};

export default function KioskViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <KioskViewInteractive />
    </Suspense>
  );
}
