import type { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ScoreboardManagementInteractive from './components/ScoreboardManagementInteractive';

export const metadata: Metadata = {
  title: 'Scoreboard Management - Scoreboard Manager',
  description:
    'Manage scoreboard entries with comprehensive CRUD operations, CSV import, search filtering, and real-time ranking updates for competition participants.',
};

function ScoreboardManagementLoading() {
  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ScoreboardManagementPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={true} />
      <div className="pt-16 flex-1">
        <Suspense fallback={<ScoreboardManagementLoading />}>
          <ScoreboardManagementInteractive />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
