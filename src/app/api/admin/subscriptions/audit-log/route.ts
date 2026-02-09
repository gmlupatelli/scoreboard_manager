import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/subscriptions/audit-log
 * Get admin audit log history (admin only)
 */
export async function GET(request: NextRequest) {
  try {
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

    // Check if user is system admin
    const { data: profile } = await authClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'system_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    // 4. Use service role client to bypass RLS
    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    // 5. Fetch audit logs with admin and target user info
    const {
      data: logs,
      error: logsError,
      count,
    } = await serviceClient
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
        ),
        target_user:target_user_id (
          id,
          email,
          full_name
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    // 6. Transform response
    const formattedLogs = (logs || []).map((log) => {
      // Handle Supabase join results - can be object or array depending on query
      const adminData = log.admin;
      const targetUserData = log.target_user;

      // Extract first item if array, otherwise use directly
      const admin = Array.isArray(adminData)
        ? (adminData[0] as { id: string; email: string; full_name: string | null } | undefined)
        : (adminData as { id: string; email: string; full_name: string | null } | null);
      const targetUser = Array.isArray(targetUserData)
        ? (targetUserData[0] as { id: string; email: string; full_name: string | null } | undefined)
        : (targetUserData as { id: string; email: string; full_name: string | null } | null);

      return {
        id: log.id,
        action: log.action,
        actionLabel: formatActionLabel(log.action),
        details: log.details,
        createdAt: log.created_at,
        admin: admin
          ? {
              id: admin.id,
              email: admin.email,
              fullName: admin.full_name,
            }
          : null,
        targetUser: targetUser
          ? {
              id: targetUser.id,
              email: targetUser.email,
              fullName: targetUser.full_name,
            }
          : null,
      };
    });

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error('Admin audit log API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
