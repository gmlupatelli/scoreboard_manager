import type { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '@/components/common/Header';
import Breadcrumb from '@/components/common/Breadcrumb';

import ScoreboardInteractive from './components/ScoreboardInteractive';
import LoadingSkeleton from './components/LoadingSkeleton';

export const metadata: Metadata = {
  title: 'Scoreboard View - Scoreboard Manager',
  description: 'View real-time competitive rankings with live score updates, search functionality, and paginated entry listings for comprehensive scoreboard monitoring.',
};

export default function IndividualScoreboardViewPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={false} />
      
      <main className="pt-16">
        <div className="bg-surface border-b border-border py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb />
          </div>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <ScoreboardInteractive />
        </Suspense>
      </main>

      <footer className="bg-surface border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-text-secondary">
            <p>&copy; {new Date().getFullYear()} Scoreboard Manager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}