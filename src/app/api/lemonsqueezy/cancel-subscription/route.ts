import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LEMON_SQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1';

interface CancelSubscriptionRequestBody {
  subscriptionId: string;
}

/**
 * Cancel a subscription via LemonSqueezy API
 * This sets the subscription to cancel at the end of the current billing period
 */
export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('Authorization'));

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authClient = getAuthClient(token);

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as CancelSubscriptionRequestBody;
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
    }

    // Verify the user owns this subscription
    const serviceClient = getServiceRoleClient();
    const dbClient = serviceClient || authClient;

    const { data: subscriptionData, error: subscriptionError } = await dbClient
      .from('subscriptions')
      .select('user_id, lemonsqueezy_subscription_id, status')
      .eq('lemonsqueezy_subscription_id', subscriptionId)
      .single();

    if (subscriptionError || !subscriptionData) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (subscriptionData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if subscription is already cancelled or expired
    if (subscriptionData.status === 'cancelled') {
      return NextResponse.json({ error: 'Subscription is already cancelled' }, { status: 400 });
    }

    if (subscriptionData.status === 'expired') {
      return NextResponse.json({ error: 'Subscription has already expired' }, { status: 400 });
    }

    const apiKey = process.env.LEMONSQUEEZY_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Lemon Squeezy is not configured' }, { status: 500 });
    }

    // Call LemonSqueezy API to cancel the subscription
    const cancelResponse = await fetch(`${LEMON_SQUEEZY_API_URL}/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'subscriptions',
          id: subscriptionId,
          attributes: {
            cancelled: true,
          },
        },
      }),
    });

    if (!cancelResponse.ok) {
      const errorBody = await cancelResponse.json();
      console.error('LemonSqueezy Cancel Error:', {
        status: cancelResponse.status,
        subscriptionId,
        error: errorBody,
      });

      return NextResponse.json(
        { error: errorBody?.errors?.[0]?.detail ?? 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    const responseBody = await cancelResponse.json();
    const attributes = responseBody?.data?.attributes;

    // Update our local database with the cancelled status
    // LemonSqueezy sets status to 'cancelled' and provides ends_at
    const { error: updateDbError } = await dbClient
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: attributes?.ends_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('lemonsqueezy_subscription_id', subscriptionId);

    if (updateDbError) {
      console.error('Failed to update local database:', updateDbError);
      // Don't fail the request - LemonSqueezy was updated successfully
      // The webhook will eventually sync the data
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: responseBody?.data?.id,
        status: attributes?.status,
        endsAt: attributes?.ends_at,
      },
    });
  } catch (error) {
    console.error('Cancel Subscription Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
