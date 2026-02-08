/*
 * Scoreboard Manager
 * Copyright (c) 2026 Scoreboard Manager contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { getTierLabel, getTierEmoji, type AppreciationTier } from '@/lib/subscription/tiers';

interface TierBadgeProps {
  tier: AppreciationTier | null;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Displays a badge showing the user's subscription tier.
 * Shows "Free" in gray for non-subscribers, or emoji + tier label with brand color for supporters.
 */
export default function TierBadge({ tier, size = 'sm', className = '' }: TierBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  if (!tier) {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-gray-100 text-gray-600 font-medium ${sizeClasses} ${className}`}
      >
        Free
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-red-600/10 text-primary font-medium ${sizeClasses} ${className}`}
    >
      <span>{getTierEmoji(tier)}</span>
      <span>{getTierLabel(tier)}</span>
    </span>
  );
}
