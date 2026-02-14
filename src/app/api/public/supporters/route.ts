import { NextResponse } from 'next/server';
import { getServiceRoleClient, getAnonClient } from '@/lib/supabase/apiClient';
import { resolveDisplayName } from '@/utils/supporterUtils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SupporterRecord {
  full_name: string | null;
  email: string;
  subscriptions: {
    supporter_display_name: string | null;
    tier: string;
    created_at: string;
  }[];
}

export interface PublicSupporter {
  displayName: string;
  tier: string;
  joinDate: string;
}

/**
 * GET /api/public/supporters
 * Returns the list of active supporters who opted in to public display.
 * Public endpoint - no authentication required.
 */
export async function GET() {
  try {
    // Use service role to query across tables, fall back to anon client
    const client = getServiceRoleClient() || getAnonClient();

    // Query user_profiles joined with subscriptions
    // Exclude system_admin users from the public supporters list
    const { data, error } = await client
      .from('user_profiles')
      .select(
        `
        full_name,
        email,
        subscriptions!inner (
          supporter_display_name,
          tier,
          created_at
        )
      `
      )
      .neq('role', 'system_admin')
      .in('subscriptions.status', ['active', 'trialing'])
      .eq('subscriptions.show_on_supporters_page', true)
      .not('subscriptions.tier', 'is', null)
      .neq('subscriptions.tier', 'appreciation');

    if (error) {
      console.error('Failed to fetch supporters:', error);
      return NextResponse.json({ error: 'Failed to fetch supporters' }, { status: 500 });
    }

    // Transform and group by tier
    const tierOrder: Record<string, number> = {
      hall_of_famer: 1,
      legend: 2,
      champion: 3,
      supporter: 4,
    };

    const supporters: PublicSupporter[] = ((data as unknown as SupporterRecord[]) || [])
      .map((record) => {
        const sub = Array.isArray(record.subscriptions)
          ? record.subscriptions[0]
          : record.subscriptions;
        if (!sub) return null;

        return {
          displayName: resolveDisplayName(
            sub.supporter_display_name,
            record.full_name,
            record.email
          ),
          tier: sub.tier,
          joinDate: sub.created_at,
        };
      })
      .filter((s): s is PublicSupporter => s !== null)
      .sort((a, b) => {
        // Primary sort: tier priority
        const tierDiff = (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99);
        if (tierDiff !== 0) return tierDiff;
        // Secondary sort: alphabetical by display name
        return a.displayName.localeCompare(b.displayName);
      });

    return NextResponse.json({ supporters }, { status: 200 });
  } catch (_error) {
    console.error('API Error:', _error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
