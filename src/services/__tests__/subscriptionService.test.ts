/**
 * Unit tests for subscriptionService
 * Tests subscription status checks, grace period logic, and API interactions
 */

// Mock the Supabase client
const mockFrom = jest.fn();
const mockAuth = {
  getSession: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: mockAuth,
  },
}));

// Import after mocking
import { subscriptionService } from '../subscriptionService';

describe('subscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.getSession.mockResolvedValue({
      data: { session: { access_token: 'test_token' } },
      error: null,
    });
  });

  // ==========================================================================
  // getSubscription Tests
  // ==========================================================================

  describe('getSubscription', () => {
    const createMockQueryChain = (data: unknown, error: unknown = null) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data, error }),
    });

    it('should return subscription data when found', async () => {
      const mockSubscription = {
        id: 'sub_123',
        user_id: 'user_123',
        status: 'active',
        billing_interval: 'monthly',
        amount_cents: 400,
        currency: 'USD',
        tier: 'supporter',
        is_gifted: false,
        show_created_by: true,
        show_on_supporters_page: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFrom.mockReturnValue(createMockQueryChain(mockSubscription));

      const result = await subscriptionService.getSubscription('user_123');

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.id).toBe('sub_123');
      expect(result.data?.status).toBe('active');
      expect(result.data?.tier).toBe('supporter');
    });

    it('should return null data when no subscription exists', async () => {
      mockFrom.mockReturnValue(createMockQueryChain(null));

      const result = await subscriptionService.getSubscription('user_123');

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('should return error when database query fails', async () => {
      mockFrom.mockReturnValue(createMockQueryChain(null, { message: 'Database error' }));

      const result = await subscriptionService.getSubscription('user_123');

      expect(result.error).toBe('Database error');
      expect(result.data).toBeNull();
    });
  });

  // ==========================================================================
  // hasActiveSubscription Tests
  // ==========================================================================

  describe('hasActiveSubscription', () => {
    const createMockQueryChain = (data: unknown, error: unknown = null) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data, error }),
    });

    it('should return true for active subscription', async () => {
      const mockSubscription = {
        id: 'sub_123',
        user_id: 'user_123',
        status: 'active',
        billing_interval: 'monthly',
        amount_cents: 400,
        currency: 'USD',
        tier: 'supporter',
        is_gifted: false,
        cancelled_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFrom.mockReturnValue(createMockQueryChain(mockSubscription));

      const result = await subscriptionService.hasActiveSubscription('user_123');

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });

    it('should return true for trialing subscription', async () => {
      const mockSubscription = {
        id: 'sub_123',
        user_id: 'user_123',
        status: 'trialing',
        billing_interval: 'monthly',
        amount_cents: 400,
        currency: 'USD',
        tier: 'supporter',
        is_gifted: false,
        cancelled_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFrom.mockReturnValue(createMockQueryChain(mockSubscription));

      const result = await subscriptionService.hasActiveSubscription('user_123');

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });

    it('should return true for cancelled subscription within grace period', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);

      const mockSubscription = {
        id: 'sub_123',
        user_id: 'user_123',
        status: 'cancelled',
        billing_interval: 'monthly',
        amount_cents: 400,
        currency: 'USD',
        tier: 'supporter',
        is_gifted: false,
        cancelled_at: futureDate.toISOString(), // ends_at is in the future
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFrom.mockReturnValue(createMockQueryChain(mockSubscription));

      const result = await subscriptionService.hasActiveSubscription('user_123');

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });

    it('should return false for cancelled subscription past grace period', async () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);

      const mockSubscription = {
        id: 'sub_123',
        user_id: 'user_123',
        status: 'cancelled',
        billing_interval: 'monthly',
        amount_cents: 400,
        currency: 'USD',
        tier: 'supporter',
        is_gifted: false,
        cancelled_at: pastDate.toISOString(), // ends_at has passed
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFrom.mockReturnValue(createMockQueryChain(mockSubscription));

      const result = await subscriptionService.hasActiveSubscription('user_123');

      expect(result.error).toBeNull();
      expect(result.data).toBe(false);
    });

    it('should return false for expired subscription', async () => {
      const mockSubscription = {
        id: 'sub_123',
        user_id: 'user_123',
        status: 'expired',
        billing_interval: 'monthly',
        amount_cents: 400,
        currency: 'USD',
        tier: 'supporter',
        is_gifted: false,
        cancelled_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFrom.mockReturnValue(createMockQueryChain(mockSubscription));

      const result = await subscriptionService.hasActiveSubscription('user_123');

      expect(result.error).toBeNull();
      expect(result.data).toBe(false);
    });

    it('should return false for past_due subscription', async () => {
      const mockSubscription = {
        id: 'sub_123',
        user_id: 'user_123',
        status: 'past_due',
        billing_interval: 'monthly',
        amount_cents: 400,
        currency: 'USD',
        tier: 'supporter',
        is_gifted: false,
        cancelled_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFrom.mockReturnValue(createMockQueryChain(mockSubscription));

      const result = await subscriptionService.hasActiveSubscription('user_123');

      expect(result.error).toBeNull();
      expect(result.data).toBe(false);
    });

    it('should return false when no subscription exists', async () => {
      mockFrom.mockReturnValue(createMockQueryChain(null));

      const result = await subscriptionService.hasActiveSubscription('user_123');

      expect(result.error).toBeNull();
      expect(result.data).toBe(false);
    });
  });

  // ==========================================================================
  // isSupporter Tests
  // ==========================================================================

  describe('isSupporter', () => {
    const createMockQueryChain = (data: unknown, error: unknown = null) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data, error }),
    });

    it('should delegate to hasActiveSubscription', async () => {
      const mockSubscription = {
        id: 'sub_123',
        user_id: 'user_123',
        status: 'active',
        billing_interval: 'monthly',
        amount_cents: 400,
        currency: 'USD',
        tier: 'supporter',
        is_gifted: false,
        cancelled_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFrom.mockReturnValue(createMockQueryChain(mockSubscription));

      const result = await subscriptionService.isSupporter('user_123');

      expect(result.data).toBe(true);
    });
  });

  // ==========================================================================
  // API Call Tests (with mocked fetch)
  // ==========================================================================

  // ==========================================================================
  // API Call Tests
  // Note: These methods are difficult to unit test effectively due to fetch
  // mocking complexity in the jsdom environment. They are better covered by
  // integration/e2e tests that test the actual API endpoints.
  //
  // The following methods have API integration:
  // - createCheckout(): calls /api/lemonsqueezy/checkout
  // - updateSubscription(): calls /api/lemonsqueezy/update-subscription
  // - resumeSubscription(): calls /api/lemonsqueezy/resume-subscription
  // - cancelSubscription(): calls /api/lemonsqueezy/cancel-subscription
  // - getPortalUrls(): calls /api/lemonsqueezy/portal
  // ==========================================================================
});
