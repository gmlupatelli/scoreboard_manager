'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { UserProfile } from '../types/models';
import { Database } from '../types/database.types';
import { useRouter } from 'next/navigation';
import { subscriptionService } from '@/services/subscriptionService';

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
type AppreciationTier = Database['public']['Enums']['appreciation_tier'];

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  subscriptionTier: AppreciationTier | null;
  subscriptionStatus: string | null;
  subscriptionEndDate: string | null;
  subscriptionLoading: boolean;
  updatePaymentMethodUrl: string | null;
  isEffectiveSupporter: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  isSystemAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<AppreciationTier | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [updatePaymentMethodUrl, setUpdatePaymentMethodUrl] = useState<string | null>(null);
  const _router = useRouter();

  const loadSubscriptionTier = async (userId: string) => {
    setSubscriptionLoading(true);
    try {
      const { data } = await subscriptionService.getSubscription(userId);
      if (data) {
        // Store status and end date for UI display
        // For cancelled subscriptions, use cancelledAt (LemonSqueezy's ends_at)
        // For active subscriptions, use currentPeriodEnd (LemonSqueezy's renews_at)
        setSubscriptionStatus(data.status);
        setUpdatePaymentMethodUrl(data.updatePaymentMethodUrl || null);
        if (data.status === 'cancelled') {
          setSubscriptionEndDate(data.cancelledAt || null);
        } else {
          setSubscriptionEndDate(data.currentPeriodEnd || null);
        }

        // Check for gifted appreciation tier
        if (data.isGifted && data.tier === 'appreciation') {
          // Check if gifted tier has expired
          if (data.giftedExpiresAt) {
            const expiresAt = new Date(data.giftedExpiresAt);
            if (expiresAt <= new Date()) {
              // Gifted tier has expired
              setSubscriptionTier(null);
              return;
            }
          }
          // Gifted tier is valid (no expiry or not yet expired)
          setSubscriptionTier(data.tier);
        } else if (
          data.status === 'active' ||
          data.status === 'trialing' ||
          data.status === 'past_due'
        ) {
          // Regular paid subscription — past_due keeps access while LS retries payment
          setSubscriptionTier(data.tier);
        } else if (data.status === 'cancelled' && data.cancelledAt) {
          // Cancelled but still within grace period (before ends_at)
          // LemonSqueezy stores the expiry date in ends_at, we store it as cancelledAt
          const endsAt = new Date(data.cancelledAt);
          if (endsAt > new Date()) {
            setSubscriptionTier(data.tier);
          } else {
            setSubscriptionTier(null);
          }
        } else {
          setSubscriptionTier(null);
        }
      } else {
        setSubscriptionTier(null);
        setSubscriptionStatus(null);
        setSubscriptionEndDate(null);
        setUpdatePaymentMethodUrl(null);
      }
    } catch (_error) {
      setSubscriptionTier(null);
      setSubscriptionStatus(null);
      setSubscriptionEndDate(null);
      setUpdatePaymentMethodUrl(null);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void loadUserProfile(session.user.id);
        void loadSubscriptionTier(session.user.id);
      } else {
        setSubscriptionLoading(false);
        setLoading(false);
      }
    });

    // Listen for auth changes (sign-in, sign-out, token refresh)
    // Skip INITIAL_SESSION to avoid duplicate profile/subscription loading
    // which causes a race where loading=false fires before profile is set
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void loadUserProfile(session.user.id);
        void loadSubscriptionTier(session.user.id);
      } else {
        setUserProfile(null);
        setSubscriptionTier(null);
        setSubscriptionStatus(null);
        setSubscriptionEndDate(null);
        setUpdatePaymentMethodUrl(null);
        setSubscriptionLoading(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const profile = data as UserProfileRow;
        setUserProfile({
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          role: profile.role,
          downgradeNoticeSeenAt: profile.downgrade_notice_seen_at,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'user',
          },
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id);
    }
  };

  const refreshSubscription = async () => {
    if (user?.id) {
      await loadSubscriptionTier(user.id);
    }
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  };

  const isSystemAdmin = () => {
    return userProfile?.role === 'system_admin';
  };

  const isEffectiveSupporter = Boolean(subscriptionTier) || userProfile?.role === 'system_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        session,
        loading,
        subscriptionTier,
        subscriptionStatus,
        subscriptionEndDate,
        subscriptionLoading,
        updatePaymentMethodUrl,
        isEffectiveSupporter,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        refreshSubscription,
        updateUserProfile,
        isSystemAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
