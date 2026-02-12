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
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import TierBadge from '@/components/ui/TierBadge';
import { useAuth } from '@/contexts/AuthContext';
import { ScoreboardCustomStyles } from '@/types/models';

interface HeaderProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
  customStyles?: ScoreboardCustomStyles | null;
}

/**
 * Navigation item definition
 */
interface NavItem {
  label: string;
  path: string;
  icon: string;
}

/**
 * User dropdown menu item — extends NavItem with optional visibility & admin-aware paths
 */
interface MenuItemLink extends NavItem {
  type: 'link';
  /** Only show for this role. Omit to show for all. */
  role?: 'system_admin' | 'user';
  /** If set, use this path when user is system_admin */
  adminPath?: string;
}

interface MenuItemAction {
  type: 'action';
  label: string;
  icon: string;
  action: () => void;
}

type MenuItem = MenuItemLink | MenuItemAction;

// ── Navigation data ──────────────────────────────────────────────

/** Landing-page links shown to unauthenticated visitors (desktop top-bar) */
const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: 'Features', path: '/#features', icon: 'SparklesIcon' },
  { label: 'Benefits', path: '/#benefits', icon: 'CheckBadgeIcon' },
  { label: 'Testimonials', path: '/#testimonials', icon: 'ChatBubbleLeftRightIcon' },
  { label: 'Scoreboards', path: '/public-scoreboard-list', icon: 'TrophyIcon' },
  { label: 'Pricing', path: '/pricing', icon: 'GiftIcon' },
  { label: 'Supporters', path: '/supporters', icon: 'HeartIcon' },
];

/** Mobile-only: includes Home at the top */
const PUBLIC_MOBILE_NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/', icon: 'HomeIcon' },
  ...PUBLIC_NAV_ITEMS,
];

/** Build the user dropdown items (needs handleLogout + role info) */
const buildUserMenuItems = (
  isAdmin: boolean,
  handleLogout: () => void,
): MenuItem[] => {
  const items: MenuItem[] = [
    { type: 'link', label: 'My Boards', path: '/dashboard', icon: 'ClipboardDocumentListIcon' },
    { type: 'link', label: 'Profile', path: '/user-profile-management', icon: 'UserCircleIcon' },
    { type: 'link', label: 'Supporter Plan', path: '/supporter-plan', icon: 'GiftIcon', role: 'user' },
    { type: 'link', label: 'Invitations', path: '/invitations', icon: 'EnvelopeIcon', adminPath: '/system-admin/invitations' },
    { type: 'link', label: 'Manage Subscriptions', path: '/system-admin/subscriptions', icon: 'CreditCardIcon', role: 'system_admin' },
    { type: 'link', label: 'System Settings', path: '/system-admin/settings', icon: 'Cog6ToothIcon', role: 'system_admin' },
    { type: 'action', label: 'Logout', icon: 'ArrowRightOnRectangleIcon', action: handleLogout },
  ];

  return items.filter((item) => {
    if (item.type === 'action') return true;
    if (!item.role) return true;
    return isAdmin ? item.role === 'system_admin' : item.role === 'user';
  });
};

const Header = ({ isAuthenticated = false, onLogout, customStyles = null }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, user, signOut, subscriptionTier } = useAuth();

  const headerStyle = customStyles
    ? {
        backgroundColor: customStyles.backgroundColor,
        borderColor: customStyles.borderColor,
        fontFamily: customStyles.fontFamily || 'inherit',
      }
    : undefined;

  const textStyle = customStyles
    ? {
        color: customStyles.textColor,
        fontFamily: customStyles.fontFamily || 'inherit',
      }
    : undefined;

  const primaryStyle = customStyles
    ? {
        backgroundColor: customStyles.accentColor,
        fontFamily: customStyles.fontFamily || 'inherit',
      }
    : undefined;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isActivePath = (path: string) => pathname === path;

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      await signOut();
      router.push('/');
    }
  };

  const displayName = userProfile?.fullName || user?.email || 'User';
  const isAdmin = userProfile?.role === 'system_admin';
  const userMenuItems = buildUserMenuItems(isAdmin, handleLogout);

  // ── Render helpers ─────────────────────────────────────────────

  /** Desktop top-bar nav link */
  const renderDesktopNavLink = (item: NavItem) => (
    <Link
      key={item.path}
      href={item.path}
      className={`flex items-center xl:space-x-1.5 px-2 xl:px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-smooth duration-150 ${
        isActivePath(item.path)
          ? 'text-primary'
          : 'text-text-secondary hover:opacity-80'
      }`}
      style={customStyles ? textStyle : undefined}
    >
      <Icon name={item.icon} size={16} className="hidden xl:block flex-shrink-0" />
      <span>{item.label}</span>
    </Link>
  );

  /** Mobile nav link (public or authenticated list) */
  const renderMobileNavLink = (item: NavItem, onClick: () => void) => (
    <Link
      key={item.path}
      href={item.path}
      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-smooth duration-150 ${
        isActivePath(item.path)
          ? 'text-primary'
          : 'text-text-secondary hover:opacity-80'
      }`}
      style={customStyles ? textStyle : undefined}
      onClick={onClick}
    >
      <Icon name={item.icon} size={20} />
      <span>{item.label}</span>
    </Link>
  );

  /** User dropdown menu item */
  const renderMenuItem = (item: MenuItem, isMobile: boolean) => {
    const iconSize = isMobile ? 20 : 18;
    const baseClass = isMobile
      ? 'flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150'
      : 'flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:opacity-80 transition-smooth duration-150';

    if (item.type === 'action') {
      return (
        <button
          key={item.label}
          onClick={item.action}
          className={baseClass}
          style={customStyles ? textStyle : undefined}
          title={item.label}
        >
          <Icon name={item.icon} size={iconSize} className="mr-3" />
          {item.label}
        </button>
      );
    }

    const href = item.adminPath && isAdmin ? item.adminPath : item.path;
    const closeMenu = isMobile
      ? () => setIsMobileMenuOpen(false)
      : () => setIsUserMenuOpen(false);

    return (
      <Link
        key={item.label}
        href={href}
        onClick={closeMenu}
        className={baseClass}
        style={customStyles ? textStyle : undefined}
      >
        <Icon name={item.icon} size={iconSize} className="mr-3" />
        {item.label}
      </Link>
    );
  };

  // ── JSX ────────────────────────────────────────────────────────

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[1000] border-b border-border bg-surface elevation-1"
      style={customStyles ? headerStyle : undefined}
    >
      <nav className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 landscape-mobile:h-12">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={isAuthenticated ? '/dashboard' : '/'}
              className="flex items-center space-x-3 hover-lift"
              aria-label="Scoreboard Manager home"
            >
              <Logo size={40} />
              <span
                className="text-2xl font-bold text-text-primary hidden sm:block tracking-tight"
                style={{ fontWeight: 700, color: customStyles?.textColor || undefined }}
              >
                Scoreboard Manager
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-3">
            {/* Public nav links */}
            {!isAuthenticated && PUBLIC_NAV_ITEMS.map(renderDesktopNavLink)}

            {/* Auth buttons or user menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150 min-w-[44px] min-h-[44px]"
                  style={customStyles ? textStyle : undefined}
                  aria-label="User menu"
                  aria-expanded={isUserMenuOpen}
                  title="Open user menu"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-primary"
                    style={primaryStyle}
                  >
                    <Icon name="UserIcon" size={18} className="text-white" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{displayName}</span>
                    {!isAdmin && <TierBadge tier={subscriptionTier} size="sm" />}
                    {isAdmin && (
                      <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 font-medium text-xs px-2 py-0.5">
                        Admin
                      </span>
                    )}
                  </div>
                  <Icon
                    name="ChevronDownIcon"
                    size={16}
                    className={`transition-transform duration-150 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[1009]"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div
                      className="absolute right-0 mt-2 w-48 border border-border rounded-md elevation-2 z-[1010] bg-popover"
                      style={
                        customStyles
                          ? {
                              backgroundColor: customStyles.backgroundColor,
                              borderColor: customStyles.borderColor,
                            }
                          : undefined
                      }
                    >
                      <div className="py-1">
                        {userMenuItems.map((item) => renderMenuItem(item, false))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Button
                  href="/register"
                  variant="outline"
                  size="sm"
                  icon="UserPlusIcon"
                  iconPosition="left"
                  iconClassName="hidden xl:inline-block"
                  title="Create a free account"
                  style={
                    customStyles
                      ? {
                          borderColor: customStyles.borderColor,
                          color: customStyles.textColor,
                          fontFamily: customStyles.fontFamily || 'inherit',
                        }
                      : undefined
                  }
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
                  style={
                    customStyles
                      ? {
                          backgroundColor: customStyles.accentColor,
                          fontFamily: customStyles.fontFamily || 'inherit',
                        }
                      : undefined
                  }
                >
                  Login
                </Button>
              </div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-11 h-11 p-2 rounded-md text-text-secondary hover:opacity-80 transition-smooth duration-150 min-w-[44px] min-h-[44px]"
              style={customStyles ? textStyle : undefined}
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
          <div
            className="lg:hidden border-t border-border"
            style={customStyles ? { borderColor: customStyles.borderColor } : undefined}
          >
            {/* Public nav links (mobile) */}
            {!isAuthenticated && (
              <div className="px-2 pt-2 pb-3 space-y-1">
                {PUBLIC_MOBILE_NAV_ITEMS.map((item) =>
                  renderMobileNavLink(item, () => setIsMobileMenuOpen(false))
                )}
              </div>
            )}

            <div
              className="border-t border-border px-2 pt-4 pb-3"
              style={customStyles ? { borderColor: customStyles.borderColor } : undefined}
            >
              {isAuthenticated ? (
                <div className="space-y-1">
                  {/* User info */}
                  <div className="flex items-center px-3 py-2">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-primary"
                      style={
                        customStyles ? { backgroundColor: customStyles.accentColor } : undefined
                      }
                    >
                      <Icon name="UserIcon" size={20} className="text-white" />
                    </div>
                    <div className="ml-3 flex flex-col">
                      <span
                        className="text-base font-medium text-text-primary"
                        style={customStyles ? { color: customStyles.textColor } : undefined}
                      >
                        {displayName}
                      </span>
                      {!isAdmin && <TierBadge tier={subscriptionTier} size="sm" />}
                      {isAdmin && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 font-medium text-xs px-2 py-0.5">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu items */}
                  {userMenuItems.map((item) => renderMenuItem(item, true))}
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    href="/register"
                    variant="outline"
                    size="md"
                    icon="UserPlusIcon"
                    iconPosition="left"
                    fullWidth
                    title="Create a free account"
                    style={
                      customStyles
                        ? {
                            borderColor: customStyles.borderColor,
                            color: customStyles.textColor,
                            fontFamily: customStyles.fontFamily || 'inherit',
                          }
                        : undefined
                    }
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
                    style={customStyles ? { backgroundColor: customStyles.accentColor } : undefined}
                  >
                    Login
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
