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

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';

// ── Navigation data ──────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

/** Desktop nav links */
const NAV_ITEMS: NavItem[] = [
  { label: 'Features', path: '/#features', icon: 'SparklesIcon' },
  { label: 'Benefits', path: '/#benefits', icon: 'CheckBadgeIcon' },
  { label: 'Testimonials', path: '/#testimonials', icon: 'ChatBubbleLeftRightIcon' },
  { label: 'Scoreboards', path: '/public-scoreboard-list', icon: 'TrophyIcon' },
  { label: 'Pricing', path: '/pricing', icon: 'GiftIcon' },
  { label: 'Supporters', path: '/supporters', icon: 'HeartIcon' },
];

/** Mobile nav links (includes Home at the top) */
const MOBILE_NAV_ITEMS: NavItem[] = [{ label: 'Home', path: '/', icon: 'HomeIcon' }, ...NAV_ITEMS];

/**
 * Lightweight header for public pages (landing, login, register, etc.)
 *
 * Bundle Size Optimization Notes:
 * - This component reduces bundle size by ~39KB by NOT importing AuthContext or Supabase
 * - The savings come from eliminating Supabase dependencies (auth-js, storage-js, postgrest-js,
 *   realtime-js), not from server-side rendering
 * - This remains a client component ('use client') because:
 *   1. Mobile menu requires useState for open/close state
 *   2. Menu auto-closes on navigation via useEffect + usePathname
 *   3. These interactive features require client-side JavaScript
 * - The trade-off is acceptable: small client bundle for interactivity vs large Supabase bundle
 *
 * Use this for unauthenticated pages to improve LCP and reduce unused JS.
 */
export default function PublicHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isActivePath = (path: string): boolean => {
    if (path.startsWith('/#')) return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] border-b border-border bg-surface elevation-1">
      <nav className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 landscape-mobile:h-12">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-3 hover-lift"
              aria-label="Scoreboard Manager home"
            >
              <Logo size={40} />
              <span className="text-2xl font-bold text-text-primary hidden sm:block tracking-tight">
                Scoreboard Manager
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center xl:space-x-1.5 px-2 xl:px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-smooth duration-150 ${
                  isActivePath(item.path) ? 'text-primary' : 'text-text-secondary hover:opacity-80'
                }`}
              >
                <Icon name={item.icon} size={16} className="hidden xl:block flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                href="/register"
                variant="outline"
                size="sm"
                icon="UserPlusIcon"
                iconPosition="left"
                iconClassName="hidden xl:inline-block"
                title="Create a free account"
              >
                Sign Up
              </Button>
              <Button
                href="/login"
                variant="primary"
                size="sm"
                icon="ArrowRightOnRectangleIcon"
                iconPosition="left"
                iconClassName="hidden xl:inline-block"
                title="Sign in to your account"
              >
                Login
              </Button>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-text-secondary hover:opacity-80 transition-smooth duration-150 min-w-[44px] min-h-[44px]"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              title="Toggle mobile menu"
            >
              <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {MOBILE_NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-smooth duration-150 ${
                    isActivePath(item.path)
                      ? 'text-primary'
                      : 'text-text-secondary hover:opacity-80'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name={item.icon} size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="border-t border-border px-2 pt-4 pb-3">
              <div className="space-y-2">
                <Button
                  href="/register"
                  variant="outline"
                  size="md"
                  icon="UserPlusIcon"
                  iconPosition="left"
                  fullWidth
                  title="Create a free account"
                >
                  Sign Up
                </Button>
                <Button
                  href="/login"
                  variant="primary"
                  size="md"
                  icon="ArrowRightOnRectangleIcon"
                  iconPosition="left"
                  fullWidth
                  title="Sign in to your account"
                >
                  Login
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
