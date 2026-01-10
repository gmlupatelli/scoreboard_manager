'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ScoreboardInteractive from './ScoreboardInteractive';
import LoadingSkeleton from './LoadingSkeleton';
import { scoreboardService } from '@/services/scoreboardService';
import { Scoreboard, ScoreboardCustomStyles } from '@/types/models';
import { getAppliedScoreboardStyles, getStylePreset } from '@/utils/stylePresets';

const ScoreboardViewLayout: React.FC = () => {
  const searchParams = useSearchParams();
  const scoreboardId = searchParams?.get('id') || null;
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [appliedStyles, setAppliedStyles] = useState<ScoreboardCustomStyles | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const loadScoreboard = async () => {
      if (!isHydrated || !scoreboardId) return;
      
      setIsLoading(true);
      try {
        const { data } = await scoreboardService.getScoreboard(scoreboardId);
        setScoreboard(data);
        
        if (data) {
          const styles = getAppliedScoreboardStyles(data, 'main');
          setAppliedStyles(styles);
        }
      } catch {
        // Error handled in ScoreboardInteractive
      } finally {
        setIsLoading(false);
      }
    };

    loadScoreboard();

    // Set up real-time subscription to detect scoreboard changes
    if (!isHydrated || !scoreboardId) return;

    const unsubscribe = scoreboardService.subscribeToScoreboardChanges(
      scoreboardId,
      {
        onScoreboardChange: () => {
          loadScoreboard();
        },
        onEntriesChange: () => {
          // Entries are handled by ScoreboardInteractive
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isHydrated, scoreboardId]);

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
      style={appliedStyles?.backgroundColor ? { backgroundColor: appliedStyles.backgroundColor } : undefined}
    >
      <Header isAuthenticated={false} customStyles={appliedStyles} />
      <main className="pt-16 flex-1">
        <ScoreboardInteractive scoreboard={scoreboard} appliedStyles={appliedStyles} />
      </main>
      <Footer customStyles={appliedStyles} />
    </div>
  );
};

export default ScoreboardViewLayout;
