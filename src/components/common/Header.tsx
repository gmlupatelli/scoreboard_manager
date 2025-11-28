'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Logo from '@/components/ui/Logo';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

const Header = ({ isAuthenticated = false, onLogout }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { userProfile, user } = useAuth();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const publicNavItems: any[] = [];

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin-dashboard', icon: 'HomeIcon' },
    { label: 'Manage Scoreboards', path: '/scoreboard-management', icon: 'Cog6ToothIcon' },
  ];

  const navItems = isAuthenticated ? adminNavItems : publicNavItems;

  const isActivePath = (path: string) => pathname === path;

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    onLogout?.();
  };

  // Display name logic: prefer fullName, fallback to email, then "User"
  const displayName = userProfile?.fullName || user?.email || 'User';

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-surface border-b border-border elevation-1">
      <nav className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href={isAuthenticated ? '/admin-dashboard' : '/'} className="flex items-center space-x-3 hover-lift">
              <Logo size={40} />
              <span className="text-2xl font-bold text-text-primary hidden sm:block tracking-tight" style={{ fontWeight: 700 }}>
                Scoreboard Manager
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
                  aria-label="User menu"
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Icon name="UserIcon" size={18} className="text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium">{displayName}</span>
                  <Icon name="ChevronDownIcon" size={16} className={`transition-transform duration-150 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[1009]" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-md elevation-2 z-[1010]">
                      <div className="py-1">
                        <Link
                          href="/user-profile-management"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
                        >
                          <Icon name="UserCircleIcon" size={18} className="mr-3" />
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
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
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150 hover-lift border border-border"
                >
                  <Icon name="UserPlusIcon" size={18} />
                  <span>Sign Up</span>
                </Link>
                <Link
                  href="/login"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-smooth duration-150 hover-lift"
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
              className="p-2 rounded-md text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
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
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/public-scoreboard-list"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                View Scoreboards
              </Link>
              <Link
                href="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
              {isAuthenticated && (
                <Link
                  href="/user-profile-management"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
              )}
            </div>

            <div className="border-t border-border px-2 pt-4 pb-3">
              {isAuthenticated ? (
                <div className="space-y-1">
                  <div className="flex items-center px-3 py-2">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <Icon name="UserIcon" size={20} className="text-primary-foreground" />
                    </div>
                    <span className="ml-3 text-base font-medium text-text-primary">{displayName}</span>
                  </div>
                  <Link
                    href="/user-profile-management"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
                  >
                    <Icon name="UserCircleIcon" size={20} className="mr-3" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
                  >
                    <Icon name="ArrowRightOnRectangleIcon" size={20} className="mr-3" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/register"
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150 border border-border"
                  >
                    <Icon name="UserPlusIcon" size={20} />
                    <span>Sign Up</span>
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium bg-primary text-primary-foreground hover:opacity-90 transition-smooth duration-150"
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