'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { scoreboardService } from '@/services/scoreboardService';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';

const categories = [
  'Gaming', 'Sports', 'Academic', 'Business', 'Fitness', 
  'Music', 'Art', 'Cooking', 'Technology', 'Community'
];

const adjectives = [
  'Ultimate', 'Grand', 'Epic', 'Premier', 'Championship',
  'Weekly', 'Monthly', 'Annual', 'Regional', 'Global'
];

const nouns = [
  'Tournament', 'Competition', 'Challenge', 'Leaderboard', 'Rankings',
  'Contest', 'Battle', 'Showdown', 'Cup', 'League'
];

export default function SeedPage() {
  const router = useRouter();
  const { user, isSystemAdmin, loading: authLoading } = useAuth();
  const [count, setCount] = useState(100);
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSeed = async () => {
    if (!user) return;
    
    setIsSeeding(true);
    setProgress(0);
    setResult(null);
    
    let success = 0;
    let failed = 0;
    
    for (let i = 1; i <= count; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      
      try {
        const { error } = await scoreboardService.createScoreboard({
          ownerId: user.id,
          title: `${adjective} ${category} ${noun} #${i}`,
          subtitle: `Test scoreboard ${i} for infinite scroll testing - ${category} category`,
          sortOrder: 'desc',
          visibility: 'public',
        });
        
        if (error) {
          failed++;
        } else {
          success++;
        }
      } catch (e) {
        failed++;
      }
      
      setProgress(Math.round((i / count) * 100));
    }
    
    setResult({ success, failed });
    setIsSeeding(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={!!user} />
      
      <main className="pt-20">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Icon name="BeakerIcon" size={32} className="text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Seed Test Scoreboards</h1>
            </div>
            
            <p className="text-muted-foreground mb-6">
              This tool will create test scoreboards to help test the infinite scrolling feature.
              All scoreboards will be created as public and owned by your account.
            </p>
            
            <div className="mb-6">
              <label htmlFor="count" className="block text-sm font-medium text-foreground mb-2">
                Number of scoreboards to create:
              </label>
              <input
                type="number"
                id="count"
                value={count}
                onChange={(e) => setCount(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))}
                min={1}
                max={500}
                disabled={isSeeding}
                className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Maximum: 500</p>
            </div>
            
            {isSeeding && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Creating scoreboards...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {result && (
              <div className={`mb-6 p-4 rounded-md ${result.failed > 0 ? 'bg-warning/10 border border-warning' : 'bg-success/10 border border-success'}`}>
                <p className="font-medium">
                  Created {result.success} scoreboards successfully.
                  {result.failed > 0 && ` ${result.failed} failed.`}
                </p>
              </div>
            )}
            
            <div className="flex space-x-4">
              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSeeding ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Icon name="PlusIcon" size={20} />
                    <span>Create {count} Scoreboards</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => router.push('/public-scoreboard-list')}
                disabled={isSeeding}
                className="px-6 py-3 border border-border rounded-md hover:bg-muted transition-smooth disabled:opacity-50"
              >
                View Scoreboards
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
