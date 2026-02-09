/**
 * Unit tests for limitsService
 * Tests free tier vs supporter tier limits, scoreboard creation checks,
 * entry limits, snapshot limits, and remaining quota calculations
 */

// Mock the Supabase client
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Mock the subscriptionService
const mockHasActiveSubscription = jest.fn();

jest.mock('@/services/subscriptionService', () => ({
  subscriptionService: {
    hasActiveSubscription: (...args: unknown[]) => mockHasActiveSubscription(...args),
  },
}));

// Import after mocking
import { limitsService } from '../limitsService';

describe('limitsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // getLimitsForUser Tests
  // ==========================================================================

  describe('getLimitsForUser', () => {
    it('should return free tier limits for non-supporters', () => {
      const limits = limitsService.getLimitsForUser(false);

      expect(limits.maxPublicScoreboards).toBe(2);
      expect(limits.maxPrivateScoreboards).toBe(0);
      expect(limits.maxEntriesPerScoreboard).toBe(50);
      expect(limits.maxSnapshotsPerScoreboard).toBe(10);
    });

    it('should return supporter tier limits for supporters', () => {
      const limits = limitsService.getLimitsForUser(true);

      expect(limits.maxPublicScoreboards).toBe(Infinity);
      expect(limits.maxPrivateScoreboards).toBe(Infinity);
      expect(limits.maxEntriesPerScoreboard).toBe(Infinity);
      expect(limits.maxSnapshotsPerScoreboard).toBe(100);
    });
  });

  // ==========================================================================
  // canCreatePublicScoreboard Tests
  // ==========================================================================

  describe('canCreatePublicScoreboard', () => {
    it('should allow supporter to create public scoreboard without checking count', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: true, error: null });

      const result = await limitsService.canCreatePublicScoreboard('user_supporter');

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
      // Should not query scoreboards count for supporters
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should allow free user to create when under limit', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // Last eq() call returns the final result with count
      chain.eq
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(chain)
        .mockResolvedValue({ count: 1, error: null });
      chain.select.mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await limitsService.canCreatePublicScoreboard('user_free');

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should deny free user when at limit', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chain.eq
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(chain)
        .mockResolvedValue({ count: 2, error: null });
      chain.select.mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await limitsService.canCreatePublicScoreboard('user_free');

      expect(result.data).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should deny free user when over limit', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chain.eq
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(chain)
        .mockResolvedValue({ count: 5, error: null });
      chain.select.mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await limitsService.canCreatePublicScoreboard('user_free');

      expect(result.data).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should return error when subscription check fails', async () => {
      mockHasActiveSubscription.mockResolvedValue({
        data: false,
        error: 'Subscription service error',
      });

      const result = await limitsService.canCreatePublicScoreboard('user_123');

      expect(result.data).toBe(false);
      expect(result.error).toBe('Subscription service error');
    });

    it('should return error when database query fails', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chain.eq
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(chain)
        .mockResolvedValue({ count: null, error: { message: 'DB error' } });
      chain.select.mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await limitsService.canCreatePublicScoreboard('user_free');

      expect(result.data).toBe(false);
      expect(result.error).toBe('DB error');
    });

    it('should handle unexpected exceptions gracefully', async () => {
      mockHasActiveSubscription.mockRejectedValue(new Error('Network error'));

      const result = await limitsService.canCreatePublicScoreboard('user_123');

      expect(result.data).toBe(false);
      expect(result.error).toBe('Failed to check public scoreboard limits.');
    });
  });

  // ==========================================================================
  // canCreatePrivateScoreboard Tests
  // ==========================================================================

  describe('canCreatePrivateScoreboard', () => {
    it('should allow supporter to create private scoreboard', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: true, error: null });

      const result = await limitsService.canCreatePrivateScoreboard('user_supporter');

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should deny free user from creating private scoreboard', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const result = await limitsService.canCreatePrivateScoreboard('user_free');

      expect(result.data).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should return error when subscription check fails', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: 'Service unavailable' });

      const result = await limitsService.canCreatePrivateScoreboard('user_123');

      expect(result.data).toBe(false);
      expect(result.error).toBe('Service unavailable');
    });

    it('should handle unexpected exceptions gracefully', async () => {
      mockHasActiveSubscription.mockRejectedValue(new Error('Crash'));

      const result = await limitsService.canCreatePrivateScoreboard('user_123');

      expect(result.data).toBe(false);
      expect(result.error).toBe('Failed to check private scoreboard limits.');
    });
  });

  // ==========================================================================
  // canAddEntry Tests
  // ==========================================================================

  describe('canAddEntry', () => {
    it('should deny when scoreboard not found', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await limitsService.canAddEntry('nonexistent_id');

      expect(result.data).toBe(false);
      expect(result.error).toBe('Scoreboard not found.');
    });

    it('should deny when scoreboard is locked', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'sb_1', owner_id: 'user_1', is_locked: true },
          error: null,
        }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await limitsService.canAddEntry('sb_1');

      expect(result.data).toBe(false);
      expect(result.error).toBe('This scoreboard is locked.');
    });

    it('should allow supporter to add entries without checking count', async () => {
      // First call: scoreboard lookup
      const scoreboardChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'sb_1', owner_id: 'user_supporter', is_locked: false },
          error: null,
        }),
      };
      mockFrom.mockReturnValueOnce(scoreboardChain);
      mockHasActiveSubscription.mockResolvedValue({ data: true, error: null });

      const result = await limitsService.canAddEntry('sb_1');

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
      // Should only call from() once (scoreboard lookup), not for entry count
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it('should allow free user to add entry when under limit', async () => {
      // First call: scoreboard lookup
      const scoreboardChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'sb_1', owner_id: 'user_free', is_locked: false },
          error: null,
        }),
      };

      // Second call: entry count
      const entryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 30, error: null }),
      };

      mockFrom.mockReturnValueOnce(scoreboardChain).mockReturnValueOnce(entryChain);
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const result = await limitsService.canAddEntry('sb_1');

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should deny free user when at entry limit', async () => {
      const scoreboardChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'sb_1', owner_id: 'user_free', is_locked: false },
          error: null,
        }),
      };

      const entryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 50, error: null }),
      };

      mockFrom.mockReturnValueOnce(scoreboardChain).mockReturnValueOnce(entryChain);
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const result = await limitsService.canAddEntry('sb_1');

      expect(result.data).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should return error when subscription check fails for entry', async () => {
      const scoreboardChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'sb_1', owner_id: 'user_1', is_locked: false },
          error: null,
        }),
      };
      mockFrom.mockReturnValue(scoreboardChain);
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: 'Sub check failed' });

      const result = await limitsService.canAddEntry('sb_1');

      expect(result.data).toBe(false);
      expect(result.error).toBe('Sub check failed');
    });

    it('should handle unexpected exceptions gracefully', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected');
      });

      const result = await limitsService.canAddEntry('sb_1');

      expect(result.data).toBe(false);
      expect(result.error).toBe('Failed to check entry limits.');
    });
  });

  // ==========================================================================
  // getMaxSnapshots Tests
  // ==========================================================================

  describe('getMaxSnapshots', () => {
    it('should return 100 for supporter', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: true, error: null });

      const result = await limitsService.getMaxSnapshots('user_supporter');

      expect(result.data).toBe(100);
      expect(result.error).toBeNull();
    });

    it('should return 10 for free user', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const result = await limitsService.getMaxSnapshots('user_free');

      expect(result.data).toBe(10);
      expect(result.error).toBeNull();
    });

    it('should return 0 and error when subscription check fails', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: 'Check failed' });

      const result = await limitsService.getMaxSnapshots('user_123');

      expect(result.data).toBe(0);
      expect(result.error).toBe('Check failed');
    });

    it('should handle unexpected exceptions gracefully', async () => {
      mockHasActiveSubscription.mockRejectedValue(new Error('Crash'));

      const result = await limitsService.getMaxSnapshots('user_123');

      expect(result.data).toBe(0);
      expect(result.error).toBe('Failed to determine snapshot limits.');
    });
  });

  // ==========================================================================
  // getRemainingPublicScoreboards Tests
  // ==========================================================================

  describe('getRemainingPublicScoreboards', () => {
    it('should return Infinity for supporter', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: true, error: null });

      const result = await limitsService.getRemainingPublicScoreboards('user_supporter');

      expect(result.data).toBe(Infinity);
      expect(result.error).toBeNull();
      // Should not query database for supporters
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should return remaining count for free user with 0 boards', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chain.eq
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(chain)
        .mockResolvedValue({ count: 0, error: null });
      chain.select.mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await limitsService.getRemainingPublicScoreboards('user_free');

      expect(result.data).toBe(2);
      expect(result.error).toBeNull();
    });

    it('should return remaining count for free user with 1 board', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chain.eq
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(chain)
        .mockResolvedValue({ count: 1, error: null });
      chain.select.mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await limitsService.getRemainingPublicScoreboards('user_free');

      expect(result.data).toBe(1);
      expect(result.error).toBeNull();
    });

    it('should return 0 remaining when at limit', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chain.eq
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(chain)
        .mockResolvedValue({ count: 2, error: null });
      chain.select.mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await limitsService.getRemainingPublicScoreboards('user_free');

      expect(result.data).toBe(0);
      expect(result.error).toBeNull();
    });

    it('should clamp to 0 when over limit (legacy data)', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chain.eq
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(chain)
        .mockResolvedValue({ count: 5, error: null });
      chain.select.mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await limitsService.getRemainingPublicScoreboards('user_free');

      expect(result.data).toBe(0);
      expect(result.error).toBeNull();
    });

    it('should return 0 and error when subscription check fails', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: 'Sub error' });

      const result = await limitsService.getRemainingPublicScoreboards('user_123');

      expect(result.data).toBe(0);
      expect(result.error).toBe('Sub error');
    });

    it('should return 0 and error when database query fails', async () => {
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chain.eq
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(chain)
        .mockResolvedValue({ count: null, error: { message: 'Query failed' } });
      chain.select.mockReturnValue(chain);
      mockFrom.mockReturnValue(chain);

      const result = await limitsService.getRemainingPublicScoreboards('user_free');

      expect(result.data).toBe(0);
      expect(result.error).toBe('Query failed');
    });

    it('should handle unexpected exceptions gracefully', async () => {
      mockHasActiveSubscription.mockRejectedValue(new Error('Network error'));

      const result = await limitsService.getRemainingPublicScoreboards('user_123');

      expect(result.data).toBe(0);
      expect(result.error).toBe('Failed to fetch remaining public scoreboards.');
    });
  });

  // ==========================================================================
  // getRemainingEntries Tests
  // ==========================================================================

  describe('getRemainingEntries', () => {
    it('should return Infinity for supporter', async () => {
      const scoreboardChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'sb_1', owner_id: 'user_supporter' },
          error: null,
        }),
      };
      mockFrom.mockReturnValueOnce(scoreboardChain);
      mockHasActiveSubscription.mockResolvedValue({ data: true, error: null });

      const result = await limitsService.getRemainingEntries('sb_1');

      expect(result.data).toBe(Infinity);
      expect(result.error).toBeNull();
      // Should only call from() once (scoreboard lookup), not for entry count
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it('should return remaining count for free user with 0 entries', async () => {
      const scoreboardChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'sb_1', owner_id: 'user_free' },
          error: null,
        }),
      };
      const entryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
      };
      mockFrom.mockReturnValueOnce(scoreboardChain).mockReturnValueOnce(entryChain);
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const result = await limitsService.getRemainingEntries('sb_1');

      expect(result.data).toBe(50);
      expect(result.error).toBeNull();
    });

    it('should return remaining count for free user with some entries', async () => {
      const scoreboardChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'sb_1', owner_id: 'user_free' },
          error: null,
        }),
      };
      const entryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 35, error: null }),
      };
      mockFrom.mockReturnValueOnce(scoreboardChain).mockReturnValueOnce(entryChain);
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const result = await limitsService.getRemainingEntries('sb_1');

      expect(result.data).toBe(15);
      expect(result.error).toBeNull();
    });

    it('should return 0 remaining when at entry limit', async () => {
      const scoreboardChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'sb_1', owner_id: 'user_free' },
          error: null,
        }),
      };
      const entryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 50, error: null }),
      };
      mockFrom.mockReturnValueOnce(scoreboardChain).mockReturnValueOnce(entryChain);
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const result = await limitsService.getRemainingEntries('sb_1');

      expect(result.data).toBe(0);
      expect(result.error).toBeNull();
    });

    it('should clamp to 0 when over entry limit (legacy data)', async () => {
      const scoreboardChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'sb_1', owner_id: 'user_free' },
          error: null,
        }),
      };
      const entryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 80, error: null }),
      };
      mockFrom.mockReturnValueOnce(scoreboardChain).mockReturnValueOnce(entryChain);
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const result = await limitsService.getRemainingEntries('sb_1');

      expect(result.data).toBe(0);
      expect(result.error).toBeNull();
    });

    it('should return error when scoreboard not found', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await limitsService.getRemainingEntries('nonexistent');

      expect(result.data).toBe(0);
      expect(result.error).toBe('Scoreboard not found.');
    });

    it('should return error when subscription check fails', async () => {
      const scoreboardChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'sb_1', owner_id: 'user_1' },
          error: null,
        }),
      };
      mockFrom.mockReturnValue(scoreboardChain);
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: 'Sub error' });

      const result = await limitsService.getRemainingEntries('sb_1');

      expect(result.data).toBe(0);
      expect(result.error).toBe('Sub error');
    });

    it('should return error when entry count query fails', async () => {
      const scoreboardChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'sb_1', owner_id: 'user_free' },
          error: null,
        }),
      };
      const entryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: null, error: { message: 'Count failed' } }),
      };
      mockFrom.mockReturnValueOnce(scoreboardChain).mockReturnValueOnce(entryChain);
      mockHasActiveSubscription.mockResolvedValue({ data: false, error: null });

      const result = await limitsService.getRemainingEntries('sb_1');

      expect(result.data).toBe(0);
      expect(result.error).toBe('Count failed');
    });

    it('should handle unexpected exceptions gracefully', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected');
      });

      const result = await limitsService.getRemainingEntries('sb_1');

      expect(result.data).toBe(0);
      expect(result.error).toBe('Failed to fetch remaining entries.');
    });
  });
});
