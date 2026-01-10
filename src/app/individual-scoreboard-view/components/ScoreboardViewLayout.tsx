'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ScoreboardInteractive from './ScoreboardInteractive';
import LoadingSkeleton from './LoadingSkeleton';
import { scoreboardService } from '@/services/scoreboardService';
import { Scoreboard, ScoreboardCustomStyles } from '@/types/models';
import { getAppliedScoreboardStyles } from '@/utils/stylePresets';

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
  }, [isHydrated, scoreboardId]);

  useEffect(() => {
    if (scoreboard) {
      const styles = getAppliedScoreboardStyles(scoreboard, 'main');
      // Fallback to Light preset if styles is null
      setAppliedStyles(styles || getAppliedScoreboardStyles({ customStyles: undefined, styleScope: 'main' }, 'main'));
    } else {
      setAppliedStyles(getAppliedScoreboardStyles({ customStyles: undefined, styleScope: 'main' }, 'main'));
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={false} customStyles={appliedStyles} />
      
      <main className="pt-16 flex-1">
        <ScoreboardInteractive />
      </main>

      <Footer customStyles={appliedStyles} />
    </div>
  );
};

export default ScoreboardViewLayout;
