import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const ACTIVE_STATUSES = ['active', 'trialing'];

/**
 * Check if a subscription record represents an active supporter
 */
export const isSupporterSubscription = (subscription: {
  status: string | null;
  cancelled_at: string | null;
  is_gifted: boolean | null;
  gifted_expires_at: string | null;
}) => {
  if (subscription.is_gifted && subscription.gifted_expires_at) {
    return new Date(subscription.gifted_expires_at) > new Date();
  }

  if (subscription.status && ACTIVE_STATUSES.includes(subscription.status)) {
    return true;
  }

  if (subscription.status === 'cancelled' && subscription.cancelled_at) {
    return new Date(subscription.cancelled_at) > new Date();
  }

  return false;
};

/**
 * Query the subscriptions table and return whether the user is an active supporter.
 * System admins always count as supporters for access control purposes.
 */
export const getSupporterStatus = async (
  client: SupabaseClient<Database>,
  userId: string
): Promise<boolean> => {
  // System admins get supporter-level access without needing a subscription
  const { data: profile } = await client
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role === 'system_admin') {
    return true;
  }

  const { data: subscription } = await client
    .from('subscriptions')
    .select('status, cancelled_at, is_gifted, gifted_expires_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return subscription ? isSupporterSubscription(subscription) : false;
};
