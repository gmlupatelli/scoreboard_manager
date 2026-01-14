'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';

/**
 * Lightweight header for public pages (landing, login, register, etc.)
 * Does NOT import AuthContext or Supabase to reduce bundle size.
 * Use this for unauthenticated pages to improve LCP and reduce unused JS.
 */
export default function PublicHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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

          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/#features"
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
            >
              <Icon name="SparklesIcon" size={18} />
              <span>Features</span>
            </Link>
            <Link
              href="/#benefits"
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
            >
              <Icon name="CheckBadgeIcon" size={18} />
              <span>Benefits</span>
            </Link>
            <Link
              href="/#testimonials"
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
            >
              <Icon name="ChatBubbleLeftRightIcon" size={18} />
              <span>Testimonials</span>
            </Link>
            <Link
              href="/public-scoreboard-list"
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
            >
              <Icon name="TrophyIcon" size={18} />
              <span>Scoreboards</span>
            </Link>
            <Button
              href="/register"
              variant="outline"
              size="sm"
              icon="UserPlusIcon"
              iconPosition="left"
            >
              Sign Up
            </Button>
            <Button
              href="/login"
              variant="primary"
              size="sm"
              icon="ArrowRightOnRectangleIcon"
              iconPosition="left"
            >
              Login
            </Button>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-text-secondary hover:opacity-80 transition-smooth duration-150 min-w-[44px] min-h-[44px]"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} />
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon name="HomeIcon" size={20} />
                <span>Home</span>
              </Link>
              <Link
                href="/#features"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon name="SparklesIcon" size={20} />
                <span>Features</span>
              </Link>
              <Link
                href="/#benefits"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon name="CheckBadgeIcon" size={20} />
                <span>Benefits</span>
              </Link>
              <Link
                href="/#testimonials"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon name="ChatBubbleLeftRightIcon" size={20} />
                <span>Testimonials</span>
              </Link>
              <Link
                href="/public-scoreboard-list"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon name="TrophyIcon" size={20} />
                <span>Scoreboards</span>
              </Link>
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
