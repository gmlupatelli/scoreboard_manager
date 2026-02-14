import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';
import { getAllVariantConfigs } from '@/lib/lemonsqueezy/variantMapping';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type TierPricingRow = Database['public']['Tables']['tier_pricing']['Row'];

interface PriceDiff {
  tier: string;
  interval: string;
  oldAmountCents: number;
  newAmountCents: number;
  variantId: string;
}

interface LemonSqueezyVariantResponse {
  data: {
    attributes: {
      price: number;
      name?: string;
    };
  };
}

/**
 * POST /api/admin/pricing/sync
 *
 * Syncs tier pricing from LemonSqueezy variant prices.
 * Admin-only endpoint. Fetches each variant's price from LS API and
 * updates the tier_pricing table. Returns a diff of changed prices.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
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

    // 2. Check admin role
    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    const { data: profile, error: profileError } = await serviceClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'system_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Get LemonSqueezy API key
    const lsApiKey = process.env.LEMONSQUEEZY_API_KEY;
    if (!lsApiKey) {
      return NextResponse.json(
        { error: 'LemonSqueezy API key is not configured' },
        { status: 500 }
      );
    }

    // 4. Get current prices from DB
    const { data: currentPrices, error: pricesError } = await serviceClient
      .from('tier_pricing')
      .select('*');

    if (pricesError) {
      return NextResponse.json({ error: pricesError.message }, { status: 500 });
    }

    // 5. Get all variant configs
    const variants = getAllVariantConfigs();
    const diffs: PriceDiff[] = [];
    let syncedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // 6. Fetch each variant from LS and compare
    for (const variant of variants) {
      if (!variant.variantId) {
        skippedCount++;
        continue;
      }

      // Skip appreciation tier
      if (variant.tier === 'appreciation') {
        skippedCount++;
        continue;
      }

      try {
        const lsResponse = await fetch(
          `https://api.lemonsqueezy.com/v1/variants/${variant.variantId}`,
          {
            headers: {
              Accept: 'application/vnd.api+json',
              Authorization: `Bearer ${lsApiKey}`,
            },
          }
        );

        if (!lsResponse.ok) {
          errors.push(
            `Failed to fetch variant ${variant.variantId} (${variant.tier}/${variant.interval}): ${lsResponse.status}`
          );
          continue;
        }

        const lsData = (await lsResponse.json()) as LemonSqueezyVariantResponse;
        const newAmountCents = lsData.data.attributes.price;

        // Find current price in DB
        const currentRow = (currentPrices as TierPricingRow[])?.find(
          (p) => p.tier === variant.tier && p.billing_interval === variant.interval
        );

        const oldAmountCents = currentRow?.amount_cents ?? 0;
        const hasChanged =
          oldAmountCents !== newAmountCents ||
          currentRow?.lemonsqueezy_variant_id !== variant.variantId;

        if (hasChanged) {
          diffs.push({
            tier: variant.tier,
            interval: variant.interval,
            oldAmountCents,
            newAmountCents,
            variantId: variant.variantId,
          });
        }

        // Upsert price (don't set updated_at — DB default handles INSERT, trigger handles UPDATE)
        const { error: upsertError } = await serviceClient.from('tier_pricing').upsert(
          {
            tier: variant.tier,
            billing_interval: variant.interval,
            amount_cents: newAmountCents,
            lemonsqueezy_variant_id: variant.variantId,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: 'tier,billing_interval' }
        );

        if (upsertError) {
          errors.push(
            `Failed to upsert ${variant.tier}/${variant.interval}: ${upsertError.message}`
          );
        } else {
          syncedCount++;
        }
      } catch (_fetchError) {
        errors.push(
          `Network error for variant ${variant.variantId} (${variant.tier}/${variant.interval})`
        );
      }
    }

    // 7. Log to audit
    await serviceClient.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'sync_pricing',
      action_label: 'Synced pricing from LemonSqueezy',
      details: {
        syncedCount,
        skippedCount,
        changesCount: diffs.length,
        priceChanges:
          diffs.length > 0
            ? diffs.map((d) => ({
                tier: d.tier,
                interval: d.interval,
                from: d.oldAmountCents,
                to: d.newAmountCents,
              }))
            : undefined,
        errors: errors.length > 0 ? errors : undefined,
      },
    });

    return NextResponse.json({
      synced: syncedCount,
      skipped: skippedCount,
      changes: diffs,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Pricing sync API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
