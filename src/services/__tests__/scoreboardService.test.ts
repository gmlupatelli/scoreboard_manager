import { scoreboardService } from '../scoreboardService';

/**
 * Unit tests for scoreboardService
 * Tests data transformation, subscription setup, and subscription cleanup
 */
interface PostgresChangeConfig {
  event?: string;
  schema?: string;
  table?: string;
  filter?: string;
}

interface RealtimeChannelMock {
  on: jest.Mock<RealtimeChannelMock, [string, PostgresChangeConfig, () => void]>;
  subscribe: jest.Mock<RealtimeChannelMock, []>;
}

const mockChannel: RealtimeChannelMock = {
  on: jest.fn<RealtimeChannelMock, [string, PostgresChangeConfig, () => void]>(),
  subscribe: jest.fn<RealtimeChannelMock, []>(),
};

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';

describe('scoreboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChannel.on.mockReturnValue(mockChannel);
    mockChannel.subscribe.mockReturnValue(mockChannel);
  });

  describe('subscribeToScoreboardChanges', () => {
    it('should set up channel with correct filter for entries changes', () => {
      const scoreboardId = 'test-board-id';
      const onEntriesChange = jest.fn();

      const unsubscribe = scoreboardService.subscribeToScoreboardChanges(scoreboardId, {
        onEntriesChange,
      });

      expect(supabase.channel).toHaveBeenCalledWith(`scoreboard-${scoreboardId}`);
      expect(mockChannel.subscribe).toHaveBeenCalled();

      // Verify cleanup function
      expect(typeof unsubscribe).toBe('function');
    });

    it('should set up channel with correct filter for scoreboard changes', () => {
      const scoreboardId = 'test-board-id';
      const onScoreboardChange = jest.fn();

      scoreboardService.subscribeToScoreboardChanges(scoreboardId, {
        onScoreboardChange,
      });

      expect(supabase.channel).toHaveBeenCalledWith(`scoreboard-${scoreboardId}`);
      expect(mockChannel.on).toHaveBeenCalled();
    });

    it('should clean up subscription when unsubscribe is called', () => {
      const scoreboardId = 'test-board-id';

      const unsubscribe = scoreboardService.subscribeToScoreboardChanges(scoreboardId, {
        onEntriesChange: jest.fn(),
      });

      unsubscribe();

      expect(supabase.removeChannel).toHaveBeenCalled();
    });

    it('should handle multiple subscriptions independently', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsub1 = scoreboardService.subscribeToScoreboardChanges('board-1', {
        onEntriesChange: callback1,
      });

      const unsub2 = scoreboardService.subscribeToScoreboardChanges('board-2', {
        onEntriesChange: callback2,
      });

      expect(supabase.channel).toHaveBeenCalledWith('scoreboard-board-1');
      expect(supabase.channel).toHaveBeenCalledWith('scoreboard-board-2');

      unsub1();
      unsub2();

      expect(supabase.removeChannel).toHaveBeenCalledTimes(2);
    });

    it('should support both entry and scoreboard change callbacks', () => {
      const onEntriesChange = jest.fn();
      const onScoreboardChange = jest.fn();

      scoreboardService.subscribeToScoreboardChanges('board-id', {
        onEntriesChange,
        onScoreboardChange,
      });

      // Both callbacks are configured
      expect(mockChannel.on).toHaveBeenCalledTimes(2);
    });

    it('should use correct postgres_changes event for entries', () => {
      const scoreboardId = 'test-id';

      scoreboardService.subscribeToScoreboardChanges(scoreboardId, {
        onEntriesChange: jest.fn(),
      });

      // Verify postgres_changes event configuration
      const callArgs = mockChannel.on.mock.calls;
      const entriesCall = callArgs.find(
        (args) =>
          args[1] &&
          args[1].table === 'scoreboard_entries' &&
          args[1].filter === `scoreboard_id=eq.${scoreboardId}`
      );

      expect(entriesCall).toBeDefined();
    });

    it('should use correct postgres_changes event for scoreboards', () => {
      const scoreboardId = 'test-id';

      scoreboardService.subscribeToScoreboardChanges(scoreboardId, {
        onScoreboardChange: jest.fn(),
      });

      // Verify postgres_changes event configuration
      const callArgs = mockChannel.on.mock.calls;
      const scoreboardCall = callArgs.find(
        (args) =>
          args[1] && args[1].table === 'scoreboards' && args[1].filter === `id=eq.${scoreboardId}`
      );

      expect(scoreboardCall).toBeDefined();
    });

    it('should not require callbacks to be provided', () => {
      expect(() => {
        scoreboardService.subscribeToScoreboardChanges('board-id', {});
      }).not.toThrow();
    });

    it('should allow optional callbacks', () => {
      const unsubscribe = scoreboardService.subscribeToScoreboardChanges('board-id', {
        onEntriesChange: undefined,
        onScoreboardChange: jest.fn(),
      });

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      expect(supabase.removeChannel).toHaveBeenCalled();
    });
  });

  describe('Real-time update contract', () => {
    it('should trigger callbacks on postgres_changes events', () => {
      const onEntriesChange = jest.fn();

      scoreboardService.subscribeToScoreboardChanges('board-id', {
        onEntriesChange,
      });

      // Simulate database change
      const callArgs = mockChannel.on.mock.calls;
      const entriesCall = callArgs.find((args) => args[1]?.table === 'scoreboard_entries');
      const entryChangedCallback = entriesCall?.[2];

      entryChangedCallback?.();

      expect(onEntriesChange).toHaveBeenCalled();
    });

    it('should listen to all postgres_changes events (*)', () => {
      scoreboardService.subscribeToScoreboardChanges('board-id', {
        onEntriesChange: jest.fn(),
      });

      const callArgs = mockChannel.on.mock.calls;
      const hasWildcard = callArgs.some((args) => args[1] && args[1].event === '*');

      expect(hasWildcard).toBe(true);
    });
  });
});
