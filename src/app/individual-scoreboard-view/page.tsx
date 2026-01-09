import type { Metadata } from 'next';
import { Suspense } from 'react';
import ScoreboardViewLayout from './components/ScoreboardViewLayout';

export const metadata: Metadata = {
  title: 'Scoreboard View - Scoreboard Manager',
  description: 'View real-time competitive rankings with live score updates, search functionality, and paginated entry listings for comprehensive scoreboard monitoring.',
};

export default function IndividualScoreboardViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ScoreboardViewLayout />
    </Suspense>
  );
}