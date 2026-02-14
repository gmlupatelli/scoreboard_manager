'use client';

import { useState, useEffect } from 'react';
import { getTierLabel, getTierEmoji } from '@/lib/subscription/tiers';

interface PublicSupporter {
  displayName: string;
  tier: string;
  joinDate: string;
}

interface TierGroup {
  tier: string;
  label: string;
  emoji: string;
  supporters: PublicSupporter[];
}

const TIER_ORDER = ['hall_of_famer', 'legend', 'champion', 'supporter'] as const;

const TIER_CONFIG: Record<string, { label: string; emoji: string }> = {
  hall_of_famer: { label: 'Hall of Famers', emoji: '👑' },
  legend: { label: 'Legends', emoji: '🌟' },
  champion: { label: 'Champions', emoji: '🏆' },
  supporter: { label: 'Supporters', emoji: '🙌' },
};

function formatJoinDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `Since ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
}

export default function SupportersList() {
  const [tierGroups, setTierGroups] = useState<TierGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSupporters = async () => {
      try {
        const response = await fetch('/api/public/supporters');
        if (!response.ok) {
          throw new Error('Failed to fetch supporters');
        }

        const data = await response.json();
        const supporters: PublicSupporter[] = data.supporters || [];

        // Group by tier
        const grouped: TierGroup[] = TIER_ORDER.map((tier) => ({
          tier,
          label:
            TIER_CONFIG[tier]?.label || getTierLabel(tier as Parameters<typeof getTierLabel>[0]),
          emoji:
            TIER_CONFIG[tier]?.emoji || getTierEmoji(tier as Parameters<typeof getTierEmoji>[0]),
          supporters: supporters.filter((s) => s.tier === tier),
        })).filter((group) => group.supporters.length > 0);

        setTierGroups(grouped);
      } catch (_err) {
        setError('Unable to load supporters list.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSupporters();
  }, []);

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-text-secondary">
        <p>{error}</p>
      </div>
    );
  }

  if (tierGroups.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center mb-10">
        <p className="text-2xl mb-3">🌱</p>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Be the first supporter!</h3>
        <p className="text-text-secondary text-sm">
          No supporters yet. Be the first to appear on the supporters wall!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-10" data-testid="supporters-list">
      <h2 className="text-2xl font-semibold text-text-primary">Our Supporters</h2>
      {tierGroups.map((group) => (
        <div key={group.tier}>
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span>{group.emoji}</span>
            {group.label}
            <span className="text-sm font-normal text-text-secondary">
              ({group.supporters.length})
            </span>
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {group.supporters.map((supporter, index) => (
              <div
                key={`${supporter.displayName}-${index}`}
                className="bg-card border border-border rounded-lg p-4 elevation-1 hover-lift transition-smooth text-center"
              >
                <p className="font-medium text-text-primary truncate" title={supporter.displayName}>
                  {supporter.displayName}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {formatJoinDate(supporter.joinDate)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
