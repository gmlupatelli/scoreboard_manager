import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/apiClient';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type TierPricingRow = Database['public']['Tables']['tier_pricing']['Row'];

/**
 * GET /api/admin/pricing
 *
 * Public endpoint returning all tier pricing data.
 * No auth required - pricing is public information (RLS allows SELECT for all).
 */
export async function GET() {
  try {
    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    const { data, error } = await serviceClient
      .from('tier_pricing')
      .select('*')
      .order('tier')
      .order('billing_interval');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const prices = (data as TierPricingRow[]).map((row) => ({
      id: row.id,
      tier: row.tier,
      billingInterval: row.billing_interval,
      amountCents: row.amount_cents,
      currency: row.currency,
      lemonsqueezyVariantId: row.lemonsqueezy_variant_id,
      lastSyncedAt: row.last_synced_at,
    }));

    return NextResponse.json({ prices });
  } catch (error) {
    console.error('Pricing API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
