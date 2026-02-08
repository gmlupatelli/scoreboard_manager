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

  const _accentStyle = customStyles
    ? {
        backgroundColor: customStyles.accentColor,
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

  interface NavItem {
    label: string;
    path: string;
    icon: string;
  }

  const publicNavItems: NavItem[] = [];

  const adminNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'HomeIcon' },
    { label: 'Manage Scoreboards', path: '/scoreboard-management', icon: 'Cog6ToothIcon' },
  ];

  const _navItems = isAuthenticated ? adminNavItems : publicNavItems;

  const _isActivePath = (path: string) => pathname === path;

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      await signOut();
      router.push('/');
    }
  };

  // Display name logic: prefer fullName, fallback to email, then "User"
  const displayName = userProfile?.fullName || user?.email || 'User';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[1000] border-b border-border bg-surface elevation-1"
      style={customStyles ? headerStyle : undefined}
    >
      <nav className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 landscape-mobile:h-12">
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

          <div className="hidden md:flex items-center space-x-4">
            {!isAuthenticated && (
              <>
                <Link
                  href="/#features"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                  style={customStyles ? textStyle : undefined}
                >
                  <Icon name="SparklesIcon" size={18} />
                  <span>Features</span>
                </Link>
                <Link
                  href="/#benefits"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                  style={customStyles ? textStyle : undefined}
                >
                  <Icon name="CheckBadgeIcon" size={18} />
                  <span>Benefits</span>
                </Link>
                <Link
                  href="/#testimonials"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                  style={customStyles ? textStyle : undefined}
                >
                  <Icon name="ChatBubbleLeftRightIcon" size={18} />
                  <span>Testimonials</span>
                </Link>
                <Link
                  href="/public-scoreboard-list"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                  style={customStyles ? textStyle : undefined}
                >
                  <Icon name="TrophyIcon" size={18} />
                  <span>Scoreboards</span>
                </Link>
                <Link
                  href="/pricing"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                  style={customStyles ? textStyle : undefined}
                >
                  <Icon name="GiftIcon" size={18} />
                  <span>Pricing</span>
                </Link>
              </>
            )}
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
                    {userProfile?.role !== 'system_admin' && (
                      <TierBadge tier={subscriptionTier} size="sm" />
                    )}
                    {userProfile?.role === 'system_admin' && (
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
                        <Link
                          href="/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:opacity-80 transition-smooth duration-150"
                          style={customStyles ? textStyle : undefined}
                        >
                          <Icon name="ClipboardDocumentListIcon" size={18} className="mr-3" />
                          My Boards
                        </Link>
                        <Link
                          href="/user-profile-management"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:opacity-80 transition-smooth duration-150"
                          style={customStyles ? textStyle : undefined}
                        >
                          <Icon name="UserCircleIcon" size={18} className="mr-3" />
                          Profile
                        </Link>
                        {userProfile?.role !== 'system_admin' && (
                          <Link
                            href="/supporter-plan"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:opacity-80 transition-smooth duration-150"
                            style={customStyles ? textStyle : undefined}
                          >
                            <Icon name="GiftIcon" size={18} className="mr-3" />
                            Supporter Plan
                          </Link>
                        )}
                        <Link
                          href={
                            userProfile?.role === 'system_admin'
                              ? '/system-admin/invitations'
                              : '/invitations'
                          }
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:opacity-80 transition-smooth duration-150"
                          style={customStyles ? textStyle : undefined}
                        >
                          <Icon name="EnvelopeIcon" size={18} className="mr-3" />
                          Invitations
                        </Link>
                        {userProfile?.role === 'system_admin' && (
                          <>
                            <Link
                              href="/system-admin/subscriptions"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:opacity-80 transition-smooth duration-150"
                              style={customStyles ? textStyle : undefined}
                            >
                              <Icon name="CreditCardIcon" size={18} className="mr-3" />
                              Manage Subscriptions
                            </Link>
                            <Link
                              href="/system-admin/settings"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:opacity-80 transition-smooth duration-150"
                              style={customStyles ? textStyle : undefined}
                            >
                              <Icon name="Cog6ToothIcon" size={18} className="mr-3" />
                              System Settings
                            </Link>
                          </>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:opacity-80 transition-smooth duration-150"
                          style={customStyles ? textStyle : undefined}
                          title="Sign out of your account"
                        >
                          <Icon name="ArrowRightOnRectangleIcon" size={18} className="mr-3" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Button
                  href="/register"
                  variant="outline"
                  size="sm"
                  icon="UserPlusIcon"
                  iconPosition="left"
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
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
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

        {isMobileMenuOpen && (
          <div
            className="md:hidden border-t border-border"
            style={customStyles ? { borderColor: customStyles.borderColor } : undefined}
          >
            {!isAuthenticated && (
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  href="/"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                  style={customStyles ? textStyle : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name="HomeIcon" size={20} />
                  <span>Home</span>
                </Link>
                <Link
                  href="/#features"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                  style={customStyles ? textStyle : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name="SparklesIcon" size={20} />
                  <span>Features</span>
                </Link>
                <Link
                  href="/#benefits"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                  style={customStyles ? textStyle : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name="CheckBadgeIcon" size={20} />
                  <span>Benefits</span>
                </Link>
                <Link
                  href="/#testimonials"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                  style={customStyles ? textStyle : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name="ChatBubbleLeftRightIcon" size={20} />
                  <span>Testimonials</span>
                </Link>
                <Link
                  href="/public-scoreboard-list"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                  style={customStyles ? textStyle : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name="TrophyIcon" size={20} />
                  <span>Scoreboards</span>
                </Link>
                <Link
                  href="/pricing"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                  style={customStyles ? textStyle : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name="GiftIcon" size={20} />
                  <span>Pricing</span>
                </Link>
              </div>
            )}

            <div
              className="border-t border-border px-2 pt-4 pb-3"
              style={customStyles ? { borderColor: customStyles.borderColor } : undefined}
            >
              {isAuthenticated ? (
                <div className="space-y-1">
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
                      {userProfile?.role !== 'system_admin' && (
                        <TierBadge tier={subscriptionTier} size="sm" />
                      )}
                      {userProfile?.role === 'system_admin' && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 font-medium text-xs px-2 py-0.5">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                    style={customStyles ? textStyle : undefined}
                  >
                    <Icon name="ClipboardDocumentListIcon" size={20} className="mr-3" />
                    My Boards
                  </Link>
                  <Link
                    href="/user-profile-management"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                    style={customStyles ? textStyle : undefined}
                  >
                    <Icon name="UserCircleIcon" size={20} className="mr-3" />
                    Profile
                  </Link>
                  {userProfile?.role !== 'system_admin' && (
                    <Link
                      href="/supporter-plan"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                      style={customStyles ? textStyle : undefined}
                    >
                      <Icon name="GiftIcon" size={20} className="mr-3" />
                      Supporter Plan
                    </Link>
                  )}
                  <Link
                    href={
                      userProfile?.role === 'system_admin'
                        ? '/system-admin/invitations'
                        : '/invitations'
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                    style={customStyles ? textStyle : undefined}
                  >
                    <Icon name="EnvelopeIcon" size={20} className="mr-3" />
                    Invitations
                  </Link>
                  {userProfile?.role === 'system_admin' && (
                    <>
                      <Link
                        href="/system-admin/subscriptions"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                        style={customStyles ? textStyle : undefined}
                      >
                        <Icon name="CreditCardIcon" size={20} className="mr-3" />
                        Manage Subscriptions
                      </Link>
                      <Link
                        href="/system-admin/settings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                        style={customStyles ? textStyle : undefined}
                      >
                        <Icon name="Cog6ToothIcon" size={20} className="mr-3" />
                        System Settings
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:opacity-80 transition-smooth duration-150"
                    style={customStyles ? textStyle : undefined}
                    title="Sign out of your account"
                  >
                    <Icon name="ArrowRightOnRectangleIcon" size={20} className="mr-3" />
                    Logout
                  </button>
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
