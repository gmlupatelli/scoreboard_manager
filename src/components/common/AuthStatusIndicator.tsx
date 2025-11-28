'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface AuthStatusIndicatorProps {
  isAuthenticated: boolean;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  className?: string;
}

const AuthStatusIndicator = ({
  isAuthenticated,
  userName = 'Admin',
  userRole = 'Administrator',
  onLogout,
  className = '',
}: AuthStatusIndicatorProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    setIsMenuOpen(false);
    onLogout?.();
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-muted transition-smooth duration-150"
        aria-label="User menu"
        aria-expanded={isMenuOpen}
      >
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center elevation-1">
          <Icon name="UserIcon" size={18} className="text-primary-foreground" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-text-primary">{userName}</p>
          <p className="text-xs text-text-secondary">{userRole}</p>
        </div>
        <Icon
          name="ChevronDownIcon"
          size={16}
          className={`hidden sm:block text-text-secondary transition-transform duration-150 ${isMenuOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-[1009]" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-md elevation-2 z-[1010]">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium text-text-primary">{userName}</p>
              <p className="text-xs text-text-secondary">{userRole}</p>
            </div>
            <div className="py-1">
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
  );
};

export default AuthStatusIndicator;