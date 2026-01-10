'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Logo from '@/components/ui/Logo';
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
  const { userProfile, user, signOut } = useAuth();

  const headerStyle = customStyles ? {
    backgroundColor: customStyles.backgroundColor,
    borderColor: customStyles.borderColor,
    fontFamily: customStyles.fontFamily || 'inherit',
  } : undefined;

  const textStyle = customStyles ? {
    color: customStyles.textColor,
    fontFamily: customStyles.fontFamily || 'inherit',
  } : undefined;

  const accentStyle = customStyles ? {
    backgroundColor: customStyles.accentColor,
    fontFamily: customStyles.fontFamily || 'inherit',
  } : undefined;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const publicNavItems: any[] = [];

  const adminNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'HomeIcon' },
    { label: 'Manage Scoreboards', path: '/scoreboard-management', icon: 'Cog6ToothIcon' },
  ];

  const navItems = isAuthenticated ? adminNavItems : publicNavItems;

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

  // Display name logic: prefer fullName, fallback to email, then "User"
  const displayName = userProfile?.fullName || user?.email || 'User';

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] border-b border-border bg-surface elevation-1" style={customStyles ? headerStyle : undefined}>
      <nav className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              href={isAuthenticated ? '/dashboard' : '/'}
              className="flex items-center space-x-3 hover-lift"
            >
              <Logo size={40} />
              <span
                className="text-2xl font-bold text-text-primary hidden sm:block tracking-tight"
                style={{ fontWeight: 700 }}
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
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:opacity-80 transition-smooth duration-150"
                  style={textStyle}
                >
                  <Icon name="SparklesIcon" size={18} />
                  <span>Features</span>
                </Link>
                <Link
                  href="/#benefits"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:opacity-80 transition-smooth duration-150"
                  style={textStyle}
                >
                  <Icon name="CheckBadgeIcon" size={18} />
                  <span>Benefits</span>
                </Link>
                <Link
                  href="/#testimonials"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:opacity-80 transition-smooth duration-150"
                  style={textStyle}
                >
                  <Icon name="ChatBubbleLeftRightIcon" size={18} />
                  <span>Testimonials</span>
                </Link>
                <Link
                  href="/public-scoreboard-list"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:opacity-80 transition-smooth duration-150"
                  style={textStyle}
                >
                  <Icon name="TrophyIcon" size={18} />
                  <span>Scoreboards</span>
                </Link>
              </>
            )}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:opacity-80 transition-smooth duration-150"
                  style={textStyle}
                  aria-label="User menu"
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={accentStyle}>
                    <Icon name="UserIcon" size={18} className="text-white" />
                  </div>
                  <span className="text-sm font-medium">{displayName}</span>
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
                    <div className="absolute right-0 mt-2 w-48 border border-border rounded-md elevation-2 z-[1010] bg-popover" style={customStyles ? { backgroundColor: customStyles.backgroundColor, borderColor: customStyles.borderColor } : undefined}>
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center w-full px-4 py-2 text-sm hover:opacity-80 transition-smooth duration-150"
                          style={textStyle}
                        >
                          <Icon name="ClipboardDocumentListIcon" size={18} className="mr-3" />
                          My Boards
                        </Link>
                        <Link
                          href="/user-profile-management"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center w-full px-4 py-2 text-sm hover:opacity-80 transition-smooth duration-150"
                          style={textStyle}
                        >
                          <Icon name="UserCircleIcon" size={18} className="mr-3" />
                          Profile
                        </Link>
                        <Link
                          href="/invitations"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center w-full px-4 py-2 text-sm hover:opacity-80 transition-smooth duration-150"
                          style={textStyle}
                        >
                          <Icon name="EnvelopeIcon" size={18} className="mr-3" />
                          Invitations
                        </Link>
                        {userProfile?.role === 'system_admin' && (
                          <Link
                            href="/system-admin/settings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center w-full px-4 py-2 text-sm hover:opacity-80 transition-smooth duration-150"
                            style={textStyle}
                          >
                            <Icon name="Cog6ToothIcon" size={18} className="mr-3" />
                            System Settings
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm hover:opacity-80 transition-smooth duration-150"
                          style={textStyle}
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
                <Link
                  href="/register"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium hover:opacity-80 transition-smooth duration-150"
                  style={{
                    color: customStyles?.textColor || 'var(--text-secondary)',
                    borderColor: customStyles?.borderColor || 'var(--border)',
                    borderWidth: '1px',
                    fontFamily: customStyles?.fontFamily || 'inherit',
                  }}
                >
                  <Icon name="UserPlusIcon" size={18} />
                  <span>Sign Up</span>
                </Link>
                <Link
                  href="/login"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-white hover:opacity-90 transition-smooth duration-150 hover-lift"
                  style={accentStyle}
                >
                  <Icon name="ArrowRightOnRectangleIcon" size={18} />
                  <span>Login</span>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md hover:opacity-80 transition-smooth duration-150"
              style={textStyle}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} />
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border" style={customStyles ? { borderColor: customStyles.borderColor } : undefined}>
            {!isAuthenticated && (
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  href="/"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium hover:opacity-80 transition-smooth duration-150"
                  style={textStyle}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name="HomeIcon" size={20} />
                  <span>Home</span>
                </Link>
                <Link
                  href="/#features"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium hover:opacity-80 transition-smooth duration-150"
                  style={textStyle}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name="SparklesIcon" size={20} />
                  <span>Features</span>
                </Link>
                <Link
                  href="/#benefits"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium hover:opacity-80 transition-smooth duration-150"
                  style={textStyle}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name="CheckBadgeIcon" size={20} />
                  <span>Benefits</span>
                </Link>
                <Link
                  href="/#testimonials"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium hover:opacity-80 transition-smooth duration-150"
                  style={textStyle}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name="ChatBubbleLeftRightIcon" size={20} />
                  <span>Testimonials</span>
                </Link>
                <Link
                  href="/public-scoreboard-list"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium hover:opacity-80 transition-smooth duration-150"
                  style={textStyle}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name="TrophyIcon" size={20} />
                  <span>Scoreboards</span>
                </Link>
              </div>
            )}

            <div className="border-t border-border px-2 pt-4 pb-3" style={customStyles ? { borderColor: customStyles.borderColor } : undefined}>
              {isAuthenticated ? (
                <div className="space-y-1">
                  <div className="flex items-center px-3 py-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={accentStyle}>
                      <Icon name="UserIcon" size={20} className="text-white" />
                    </div>
                    <span className="ml-3 text-base font-medium" style={{ color: customStyles?.textColor || 'var(--text-primary)' }}>
                      {displayName}
                    </span>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium hover:opacity-80 transition-smooth duration-150"
                    style={textStyle}
                  >
                    <Icon name="ClipboardDocumentListIcon" size={20} className="mr-3" />
                    My Boards
                  </Link>
                  <Link
                    href="/user-profile-management"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium hover:opacity-80 transition-smooth duration-150"
                    style={textStyle}
                  >
                    <Icon name="UserCircleIcon" size={20} className="mr-3" />
                    Profile
                  </Link>
                  <Link
                    href="/invitations"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium hover:opacity-80 transition-smooth duration-150"
                    style={textStyle}
                  >
                    <Icon name="EnvelopeIcon" size={20} className="mr-3" />
                    Invitations
                  </Link>
                  {userProfile?.role === 'system_admin' && (
                    <Link
                      href="/system-admin/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium hover:opacity-80 transition-smooth duration-150"
                      style={textStyle}
                    >
                      <Icon name="Cog6ToothIcon" size={20} className="mr-3" />
                      System Settings
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium hover:opacity-80 transition-smooth duration-150"
                    style={textStyle}
                  >
                    <Icon name="ArrowRightOnRectangleIcon" size={20} className="mr-3" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/register"
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium hover:opacity-80 transition-smooth duration-150"
                    style={{
                      color: customStyles?.textColor || 'var(--text-secondary)',
                      borderColor: customStyles?.borderColor || 'var(--border)',
                      borderWidth: '1px',
                      fontFamily: customStyles?.fontFamily || 'inherit',
                    }}
                  >
                    <Icon name="UserPlusIcon" size={20} />
                    <span>Sign Up</span>
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-white hover:opacity-90 transition-smooth duration-150"
                    style={accentStyle}
                  >
                    <Icon name="ArrowRightOnRectangleIcon" size={20} />
                    <span>Login</span>
                  </Link>
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
