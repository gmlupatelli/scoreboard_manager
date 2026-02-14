import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PER_PAGE = 10;

interface RouteContext {
  params: Promise<{ userId: string }>;
}

/**
 * Format action string to human-readable label
 */
function formatActionLabel(action: string): string {
  const actionLabels: Record<string, string> = {
    cancel_subscription: 'Cancelled Subscription',
    link_subscription: 'Linked Subscription',
    gift_appreciation_tier: 'Gifted Appreciation Tier',
    remove_appreciation_tier: 'Removed Appreciation Tier',
    refetch_subscription: 'Refetched Subscription',
  };
  return actionLabels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * GET /api/admin/users/[userId]/details
 * Get comprehensive user details for admin view.
 *
 * Query params:
 *   - section: 'all' | 'payments' | 'scoreboards' | 'auditLog' (default: 'all')
 *   - paymentsPage: number (default: 1)
 *   - scoreboardsPage: number (default: 1)
 *   - auditLogPage: number (default: 1)
 *
 * When section='all', returns all sections.
 * When a specific section is given, only that section is returned (for Load More).
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await context.params;

    // 1. Extract and validate token
    const token = extractBearerToken(request.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get authenticated user and verify admin role
    const authClient = getAuthClient(token);
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await authClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'system_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 3. Use service role client to bypass RLS
    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'all';
    const paymentsPage = parseInt(searchParams.get('paymentsPage') || '1', 10);
    const scoreboardsPage = parseInt(searchParams.get('scoreboardsPage') || '1', 10);
    const auditLogPage = parseInt(searchParams.get('auditLogPage') || '1', 10);

    const fetchAll = section === 'all';

    // 5. Always verify user exists (fetch profile if needed)
    if (fetchAll || section === 'profile') {
      // Fetch user profile, auth metadata, and subscription in parallel
      const [profileResult, authResult, subscriptionResult] = await Promise.all([
        serviceClient
          .from('user_profiles')
          .select('id, email, full_name, role, created_at')
          .eq('id', userId)
          .single(),
        serviceClient.auth.admin.getUserById(userId),
        serviceClient
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (profileResult.error || !profileResult.data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const targetUser = profileResult.data;
      const authUser = authResult.data?.user;

      // Build base response with profile + subscription
      const response: Record<string, unknown> = {
        user: {
          id: targetUser.id,
          email: targetUser.email,
          fullName: targetUser.full_name,
          role: targetUser.role,
          createdAt: targetUser.created_at,
          emailVerified: !!authUser?.email_confirmed_at,
          lastSignInAt: authUser?.last_sign_in_at || null,
        },
        subscription: subscriptionResult.data
          ? {
              id: subscriptionResult.data.id,
              status: subscriptionResult.data.status,
              statusFormatted: subscriptionResult.data.status_formatted,
              tier: subscriptionResult.data.tier,
              billingInterval: subscriptionResult.data.billing_interval,
              amountCents: subscriptionResult.data.amount_cents,
              currency: subscriptionResult.data.currency,
              isGifted: subscriptionResult.data.is_gifted,
              giftedExpiresAt: subscriptionResult.data.gifted_expires_at,
              currentPeriodEnd: subscriptionResult.data.current_period_end,
              lemonsqueezySubscriptionId: subscriptionResult.data.lemonsqueezy_subscription_id,
              paymentFailureCount: subscriptionResult.data.payment_failure_count,
              lastPaymentFailedAt: subscriptionResult.data.last_payment_failed_at,
              cardBrand: subscriptionResult.data.card_brand,
              cardLastFour: subscriptionResult.data.card_last_four,
              createdAt: subscriptionResult.data.created_at,
              updatedAt: subscriptionResult.data.updated_at,
            }
          : null,
      };

      if (!fetchAll) {
        return NextResponse.json(response);
      }

      // Fetch remaining sections in parallel
      const [paymentsResult, scoreboardsResult, auditLogResult] = await Promise.all([
        fetchPayments(serviceClient, userId, paymentsPage),
        fetchScoreboards(serviceClient, userId, scoreboardsPage),
        fetchAuditLog(serviceClient, userId, auditLogPage),
      ]);

      return NextResponse.json({
        ...response,
        paymentHistory: paymentsResult,
        scoreboards: scoreboardsResult,
        auditLog: auditLogResult,
      });
    }

    // Single section fetch (for Load More)
    if (section === 'payments') {
      const result = await fetchPayments(serviceClient, userId, paymentsPage);
      return NextResponse.json({ paymentHistory: result });
    }

    if (section === 'scoreboards') {
      const result = await fetchScoreboards(serviceClient, userId, scoreboardsPage);
      return NextResponse.json({ scoreboards: result });
    }

    if (section === 'auditLog') {
      const result = await fetchAuditLog(serviceClient, userId, auditLogPage);
      return NextResponse.json({ auditLog: result });
    }

    return NextResponse.json({ error: 'Invalid section parameter' }, { status: 400 });
  } catch (error) {
    console.error('Admin user details API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// Data fetching helpers
// ============================================================================

type SupabaseAdminClient = NonNullable<ReturnType<typeof getServiceRoleClient>>;

async function fetchPayments(client: SupabaseAdminClient, userId: string, page: number) {
  const offset = (page - 1) * PER_PAGE;

  const {
    data: payments,
    count,
    error,
  } = await client
    .from('payment_history')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + PER_PAGE - 1);

  if (error) {
    return { payments: [], pagination: { page, perPage: PER_PAGE, total: 0, hasMore: false } };
  }

  const total = count || 0;

  return {
    payments: (payments || []).map((p) => ({
      id: p.id,
      userId: p.user_id,
      subscriptionId: p.subscription_id,
      lemonsqueezyOrderId: p.lemonsqueezy_order_id,
      orderNumber: p.lemonsqueezy_order_number,
      status: p.status,
      statusFormatted: p.status_formatted,
      currency: p.currency,
      totalCents: p.total_cents,
      totalUsdCents: p.total_usd_cents,
      taxCents: p.tax_cents,
      discountTotalCents: p.discount_total_cents,
      createdAt: p.created_at,
      receiptUrl: p.receipt_url,
      orderItemProductName: p.order_item_product_name,
      orderItemVariantName: p.order_item_variant_name,
      orderItemQuantity: p.order_item_quantity,
      orderItemPriceCents: p.order_item_price_cents,
    })),
    pagination: {
      page,
      perPage: PER_PAGE,
      total,
      hasMore: offset + PER_PAGE < total,
    },
  };
}

async function fetchScoreboards(client: SupabaseAdminClient, userId: string, page: number) {
  const offset = (page - 1) * PER_PAGE;

  const {
    data: scoreboards,
    count,
    error,
  } = await client
    .from('scoreboards')
    .select('id, title, visibility, created_at, scoreboard_entries(count)', { count: 'exact' })
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + PER_PAGE - 1);

  if (error) {
    return { scoreboards: [], pagination: { page, perPage: PER_PAGE, total: 0, hasMore: false } };
  }

  const total = count || 0;

  return {
    scoreboards: (scoreboards || []).map((s) => {
      // Supabase returns count as array with { count: number }
      const entryCountData = s.scoreboard_entries as unknown as { count: number }[] | null;
      const entryCount = entryCountData?.[0]?.count ?? 0;

      return {
        id: s.id,
        title: s.title,
        visibility: s.visibility as 'public' | 'private',
        entryCount,
        createdAt: s.created_at,
      };
    }),
    pagination: {
      page,
      perPage: PER_PAGE,
      total,
      hasMore: offset + PER_PAGE < total,
    },
  };
}

async function fetchAuditLog(client: SupabaseAdminClient, userId: string, page: number) {
  const offset = (page - 1) * PER_PAGE;

  const {
    data: logs,
    count,
    error,
  } = await client
    .from('admin_audit_log')
    .select(
      `
      id,
      action,
      details,
      created_at,
      admin:admin_id (
        id,
        email,
        full_name
      )
    `,
      { count: 'exact' }
    )
    .eq('target_user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + PER_PAGE - 1);

  if (error) {
    return { entries: [], pagination: { page, perPage: PER_PAGE, total: 0, hasMore: false } };
  }

  const total = count || 0;

  return {
    entries: (logs || []).map((log) => {
      const adminData = log.admin;
      const admin = Array.isArray(adminData)
        ? (adminData[0] as { id: string; email: string; full_name: string | null } | undefined)
        : (adminData as { id: string; email: string; full_name: string | null } | null);

      return {
        id: log.id,
        action: log.action,
        actionLabel: formatActionLabel(log.action),
        details: (log.details || {}) as Record<string, unknown>,
        createdAt: log.created_at,
        admin: admin
          ? {
              id: admin.id,
              email: admin.email,
              fullName: admin.full_name,
            }
          : null,
      };
    }),
    pagination: {
      page,
      perPage: PER_PAGE,
      total,
      hasMore: offset + PER_PAGE < total,
    },
  };
}
