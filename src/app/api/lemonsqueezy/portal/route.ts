import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LEMON_SQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1';

interface PortalRequestBody {
  subscriptionId: string;
}

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

    const body = (await request.json()) as PortalRequestBody;

    if (!body?.subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    const apiKey = process.env.LEMONSQUEEZY_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Lemon Squeezy is not configured' }, { status: 500 });
    }

    const subscriptionResponse = await fetch(
      `${LEMON_SQUEEZY_API_URL}/subscriptions/${body.subscriptionId}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!subscriptionResponse.ok) {
      const errorBody = await subscriptionResponse.json();
      return NextResponse.json(
        { error: errorBody?.errors?.[0]?.detail ?? 'Failed to fetch subscription' },
        { status: 500 }
      );
    }

    const responseBody = await subscriptionResponse.json();
    const urls = responseBody?.data?.attributes?.urls as
      | {
          update_payment_method?: string | null;
          customer_portal?: string | null;
          customer_portal_update_subscription?: string | null;
        }
      | undefined;

    return NextResponse.json({
      updatePaymentMethodUrl: urls?.update_payment_method ?? null,
      customerPortalUrl: urls?.customer_portal ?? null,
      customerPortalUpdateSubscriptionUrl: urls?.customer_portal_update_subscription ?? null,
    });
  } catch (error) {
    console.error('Portal Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
