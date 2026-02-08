import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LEMON_SQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1';

interface ResumeSubscriptionRequestBody {
  subscriptionId: string;
}

/**
 * Resume a cancelled subscription via LemonSqueezy API
 * This "un-cancels" a subscription that was set to cancel at period end
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

    const body = (await request.json()) as ResumeSubscriptionRequestBody;
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
    }

    // Verify the user owns this subscription
    const serviceClient = getServiceRoleClient();
    const dbClient = serviceClient || authClient;

    const { data: subscriptionData, error: subscriptionError } = await dbClient
      .from('subscriptions')
      .select('user_id, lemonsqueezy_subscription_id, status, cancelled_at')
      .eq('lemonsqueezy_subscription_id', subscriptionId)
      .single();

    if (subscriptionError || !subscriptionData) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (subscriptionData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if subscription is actually cancelled
    if (subscriptionData.status !== 'cancelled') {
      return NextResponse.json({ error: 'Subscription is not cancelled' }, { status: 400 });
    }

    // Check if ends_at deadline has passed (cannot resume expired subscriptions)
    // For cancelled subscriptions, cancelled_at stores LemonSqueezy's ends_at field
    if (subscriptionData.cancelled_at) {
      const endsAt = new Date(subscriptionData.cancelled_at);
      if (endsAt <= new Date()) {
        return NextResponse.json(
          { error: 'Subscription period has ended. Please start a new subscription.' },
          { status: 400 }
        );
      }
    }

    const apiKey = process.env.LEMONSQUEEZY_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Lemon Squeezy is not configured' }, { status: 500 });
    }

    // Call LemonSqueezy API to resume (un-cancel) the subscription
    const resumeResponse = await fetch(`${LEMON_SQUEEZY_API_URL}/subscriptions/${subscriptionId}`, {
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
            cancelled: false,
          },
        },
      }),
    });

    if (!resumeResponse.ok) {
      const errorBody = await resumeResponse.json();
      console.error('LemonSqueezy Resume Error:', {
        status: resumeResponse.status,
        subscriptionId,
        error: errorBody,
      });

      return NextResponse.json(
        { error: errorBody?.errors?.[0]?.detail ?? 'Failed to resume subscription' },
        { status: 500 }
      );
    }

    const responseBody = await resumeResponse.json();
    const attributes = responseBody?.data?.attributes;

    // Update our local database with the resumed status
    const { error: updateDbError } = await dbClient
      .from('subscriptions')
      .update({
        status: attributes?.status || 'active',
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
        currentPeriodEnd: attributes?.renews_at,
      },
    });
  } catch (error) {
    console.error('Resume Subscription Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
