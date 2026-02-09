'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profileService';
import { scoreboardService } from '@/services/scoreboardService';
import DowngradeNoticeModal from '@/components/common/DowngradeNoticeModal';

export default function DowngradeNoticeManager() {
  const { user, userProfile, subscriptionStatus, subscriptionLoading, updateUserProfile } =
    useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasLockedRef = useRef(false);
  const isUpdatingRef = useRef(false);

  const shouldShowExpiredNotice =
    subscriptionStatus === 'expired' && !userProfile?.downgradeNoticeSeenAt;

  useEffect(() => {
    if (!user?.id || subscriptionLoading) return;

    if (subscriptionStatus === 'expired' && !hasLockedRef.current) {
      hasLockedRef.current = true;
      scoreboardService.lockAllScoreboards();
    }

    if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
      hasLockedRef.current = false;
    }
  }, [subscriptionStatus, subscriptionLoading, user?.id]);

  useEffect(() => {
    if (!user?.id || subscriptionLoading) return;

    if (shouldShowExpiredNotice) {
      setIsModalOpen(true);
    }
  }, [shouldShowExpiredNotice, subscriptionLoading, user?.id]);

  useEffect(() => {
    if (!user?.id || subscriptionLoading) return;

    const shouldResetNotice =
      (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') &&
      userProfile?.downgradeNoticeSeenAt;

    if (!shouldResetNotice || isUpdatingRef.current) return;

    const resetNotice = async () => {
      isUpdatingRef.current = true;
      const { error } = await profileService.clearDowngradeNoticeSeen(user.id);
      if (!error) {
        updateUserProfile({ downgradeNoticeSeenAt: null });
      }
      isUpdatingRef.current = false;
    };

    resetNotice();
  }, [
    subscriptionStatus,
    subscriptionLoading,
    user?.id,
    userProfile?.downgradeNoticeSeenAt,
    updateUserProfile,
  ]);

  const handleDismiss = async () => {
    setIsModalOpen(false);

    if (!user?.id || isUpdatingRef.current) return;

    isUpdatingRef.current = true;
    const { error } = await profileService.markDowngradeNoticeSeen(user.id);
    if (!error) {
      updateUserProfile({ downgradeNoticeSeenAt: new Date().toISOString() });
    }
    isUpdatingRef.current = false;
  };

  return <DowngradeNoticeModal isOpen={isModalOpen} onDismiss={handleDismiss} />;
}
