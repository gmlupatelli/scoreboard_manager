import { supabase } from '@/lib/supabase/client';
import { subscriptionService } from '@/services/subscriptionService';

interface UserLimits {
  maxPublicScoreboards: number;
  maxPrivateScoreboards: number;
  maxEntriesPerScoreboard: number;
  maxSnapshotsPerScoreboard: number;
}

const getLimitsForUser = (isSupporter: boolean): UserLimits => {
  if (isSupporter) {
    return {
      maxPublicScoreboards: Infinity,
      maxPrivateScoreboards: Infinity,
      maxEntriesPerScoreboard: Infinity,
      maxSnapshotsPerScoreboard: 100,
    };
  }

  return {
    maxPublicScoreboards: 2,
    maxPrivateScoreboards: 0,
    maxEntriesPerScoreboard: 50,
    maxSnapshotsPerScoreboard: 10,
  };
};

export const limitsService = {
  getLimitsForUser,

  async canCreatePublicScoreboard(userId: string) {
    try {
      const { data: isSupporter, error: supporterError } =
        await subscriptionService.hasActiveSubscription(userId);

      if (supporterError) {
        return { data: false, error: supporterError };
      }

      const limits = getLimitsForUser(isSupporter);
      if (limits.maxPublicScoreboards === Infinity) {
        return { data: true, error: null };
      }

      const { count, error } = await supabase
        .from('scoreboards')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('visibility', 'public')
        .eq('is_locked', false);

      if (error) {
        return { data: false, error: error.message };
      }

      return { data: (count || 0) < limits.maxPublicScoreboards, error: null };
    } catch (_error) {
      return { data: false, error: 'Failed to check public scoreboard limits.' };
    }
  },

  async canCreatePrivateScoreboard(userId: string) {
    try {
      const { data: isSupporter, error: supporterError } =
        await subscriptionService.hasActiveSubscription(userId);

      if (supporterError) {
        return { data: false, error: supporterError };
      }

      const limits = getLimitsForUser(isSupporter);
      return { data: limits.maxPrivateScoreboards > 0, error: null };
    } catch (_error) {
      return { data: false, error: 'Failed to check private scoreboard limits.' };
    }
  },

  async canAddEntry(scoreboardId: string) {
    try {
      const { data: scoreboard, error: scoreboardError } = await supabase
        .from('scoreboards')
        .select('id, owner_id, is_locked')
        .eq('id', scoreboardId)
        .single();

      if (scoreboardError || !scoreboard) {
        return { data: false, error: 'Scoreboard not found.' };
      }

      if (scoreboard.is_locked) {
        return { data: false, error: 'This scoreboard is locked.' };
      }

      const { data: isSupporter, error: supporterError } =
        await subscriptionService.hasActiveSubscription(scoreboard.owner_id);

      if (supporterError) {
        return { data: false, error: supporterError };
      }

      const limits = getLimitsForUser(isSupporter);
      if (limits.maxEntriesPerScoreboard === Infinity) {
        return { data: true, error: null };
      }

      const { count, error } = await supabase
        .from('scoreboard_entries')
        .select('*', { count: 'exact', head: true })
        .eq('scoreboard_id', scoreboardId);

      if (error) {
        return { data: false, error: error.message };
      }

      return { data: (count || 0) < limits.maxEntriesPerScoreboard, error: null };
    } catch (_error) {
      return { data: false, error: 'Failed to check entry limits.' };
    }
  },

  async getMaxSnapshots(userId: string) {
    try {
      const { data: isSupporter, error: supporterError } =
        await subscriptionService.hasActiveSubscription(userId);

      if (supporterError) {
        return { data: 0, error: supporterError };
      }

      const limits = getLimitsForUser(isSupporter);
      return { data: limits.maxSnapshotsPerScoreboard, error: null };
    } catch (_error) {
      return { data: 0, error: 'Failed to determine snapshot limits.' };
    }
  },

  async getRemainingPublicScoreboards(userId: string) {
    try {
      const { data: isSupporter, error: supporterError } =
        await subscriptionService.hasActiveSubscription(userId);

      if (supporterError) {
        return { data: 0, error: supporterError };
      }

      const limits = getLimitsForUser(isSupporter);
      if (limits.maxPublicScoreboards === Infinity) {
        return { data: Infinity, error: null };
      }

      const { count, error } = await supabase
        .from('scoreboards')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('visibility', 'public')
        .eq('is_locked', false);

      if (error) {
        return { data: 0, error: error.message };
      }

      return {
        data: Math.max(limits.maxPublicScoreboards - (count || 0), 0),
        error: null,
      };
    } catch (_error) {
      return { data: 0, error: 'Failed to fetch remaining public scoreboards.' };
    }
  },

  async getRemainingEntries(scoreboardId: string) {
    try {
      const { data: scoreboard, error: scoreboardError } = await supabase
        .from('scoreboards')
        .select('id, owner_id')
        .eq('id', scoreboardId)
        .single();

      if (scoreboardError || !scoreboard) {
        return { data: 0, error: 'Scoreboard not found.' };
      }

      const { data: isSupporter, error: supporterError } =
        await subscriptionService.hasActiveSubscription(scoreboard.owner_id);

      if (supporterError) {
        return { data: 0, error: supporterError };
      }

      const limits = getLimitsForUser(isSupporter);
      if (limits.maxEntriesPerScoreboard === Infinity) {
        return { data: Infinity, error: null };
      }

      const { count, error } = await supabase
        .from('scoreboard_entries')
        .select('*', { count: 'exact', head: true })
        .eq('scoreboard_id', scoreboardId);

      if (error) {
        return { data: 0, error: error.message };
      }

      return {
        data: Math.max(limits.maxEntriesPerScoreboard - (count || 0), 0),
        error: null,
      };
    } catch (_error) {
      return { data: 0, error: 'Failed to fetch remaining entries.' };
    }
  },
};
