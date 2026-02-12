import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';
import { validateDisplayName } from '@/utils/supporterUtils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PATCH /api/user/supporter-preferences
 * Updates supporter display preferences (display name and visibility on supporters page).
 */
export async function PATCH(request: NextRequest) {
  try {
    // 1. Extract and validate token
    const token = extractBearerToken(request.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get authenticated user
    const authClient = getAuthClient(token);
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Parse request body
    const body = await request.json();
    const { showOnSupportersPage, supporterDisplayName } = body;

    // 4. Validate input
    if (typeof showOnSupportersPage !== 'boolean') {
      return NextResponse.json(
        { error: 'showOnSupportersPage must be a boolean' },
        { status: 400 }
      );
    }

    // 5. Validate display name if provided
    const trimmedName =
      supporterDisplayName === null || supporterDisplayName === undefined
        ? null
        : String(supporterDisplayName).trim();

    if (trimmedName !== null && trimmedName !== '') {
      const nameError = validateDisplayName(trimmedName);
      if (nameError) {
        return NextResponse.json({ error: nameError }, { status: 400 });
      }
    }

    // 6. Use service client for the update (bypasses RLS)
    const serviceClient = getServiceRoleClient();
    const dbClient = serviceClient || authClient;

    // 7. Find the user's most recent active subscription
    const { data: subscription, error: subError } = await dbClient
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // 8. Update the subscription
    const updateData: Record<string, unknown> = {
      show_on_supporters_page: showOnSupportersPage,
      supporter_display_name: trimmedName === '' ? null : trimmedName,
    };

    const { data: updated, error: updateError } = await dbClient
      .from('subscriptions')
      .update(updateData as never)
      .eq('id', subscription.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 9. Return updated subscription
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (_error) {
    console.error('API Error:', _error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
