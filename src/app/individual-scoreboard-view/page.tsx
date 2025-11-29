import type { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ScoreboardInteractive from './components/ScoreboardInteractive';
import LoadingSkeleton from './components/LoadingSkeleton';

export const metadata: Metadata = {
  title: 'Scoreboard View - Scoreboard Manager',
  description: 'View real-time competitive rankings with live score updates, search functionality, and paginated entry listings for comprehensive scoreboard monitoring.',
};

export default function IndividualScoreboardViewPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={false} />
      
      <main className="pt-16 flex-1">
        <Suspense fallback={<LoadingSkeleton />}>
          <ScoreboardInteractive />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}