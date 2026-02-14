'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ScoreboardInteractive from './ScoreboardInteractive';
import LoadingSkeleton from './LoadingSkeleton';
import { scoreboardService } from '@/services/scoreboardService';
import { Scoreboard, ScoreboardCustomStyles, ScoreboardEntry } from '@/types/models';
import { getAppliedScoreboardStyles, getStylePreset } from '@/utils/stylePresets';

export default function ScoreboardViewLayout() {
  const searchParams = useSearchParams();
  const scoreboardId = searchParams?.get('id') || null;

  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [entries, setEntries] = useState<ScoreboardEntry[]>([]);
  const [appliedStyles, setAppliedStyles] = useState<ScoreboardCustomStyles | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const loadScoreboard = useCallback(async () => {
    if (!scoreboardId) return;

    try {
      const { data } = await scoreboardService.getScoreboard(scoreboardId);
      setScoreboard(data);

      if (data) {
        const styles = getAppliedScoreboardStyles(data, 'main');
        setAppliedStyles(styles);
      }
    } catch {
      // Error handled in ScoreboardInteractive
    }
  }, [scoreboardId]);

  const loadEntries = useCallback(async () => {
    if (!scoreboardId) return;

    try {
      const { data: entriesData } = await scoreboardService.getScoreboardEntries(scoreboardId);
      setEntries(entriesData || []);
    } catch {
      // Error handled in ScoreboardInteractive
    }
  }, [scoreboardId]);

  useEffect(() => {
    if (!isHydrated || !scoreboardId) return;

    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([loadScoreboard(), loadEntries()]);
      setIsLoading(false);
    };

    void loadInitialData();

    // Set up single real-time subscription for both scoreboard and entries
    const unsubscribe = scoreboardService.subscribeToScoreboardChanges(scoreboardId, {
      onScoreboardChange: () => {
        void loadScoreboard();
      },
      onEntriesChange: () => {
        void loadEntries();
      },
    });

    return () => {
      unsubscribe();
    };
  }, [isHydrated, scoreboardId, loadScoreboard, loadEntries]);

  useEffect(() => {
    if (scoreboard) {
      const styles = getAppliedScoreboardStyles(scoreboard, 'main');
      // Fallback to Light preset if styles is null
      setAppliedStyles(styles || getStylePreset('light'));
    } else {
      setAppliedStyles(getStylePreset('light'));
    }
  }, [scoreboard]);

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={false} />
        <main className="pt-16 flex-1">
          <LoadingSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={
        appliedStyles?.backgroundColor
          ? { backgroundColor: appliedStyles.backgroundColor }
          : undefined
      }
    >
      <Header isAuthenticated={false} customStyles={appliedStyles} />
      <main className="pt-16 flex-1">
        {scoreboard?.visibility === 'private' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-yellow-500/10 border border-warning rounded-lg p-6 text-center">
              <h2 className="text-lg font-semibold text-text-primary mb-2">Private Scoreboard</h2>
              <p className="text-sm text-text-secondary">
                This scoreboard is private and not available for public viewing. The owner needs an
                active Supporter plan to share private scoreboards.
              </p>
            </div>
          </div>
        ) : (
          <ScoreboardInteractive
            scoreboard={scoreboard}
            entries={entries}
            appliedStyles={appliedStyles}
          />
        )}
      </main>
      <Footer customStyles={appliedStyles} />
    </div>
  );
}
