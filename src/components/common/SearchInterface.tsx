'use client';

import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';

interface SearchInterfaceProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
  showClearButton?: boolean;
  autoFocus?: boolean;
}

const SearchInterface = ({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  className = '',
  showClearButton = true,
  autoFocus = false,
}: SearchInterfaceProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useCallback(
    (query: string) => {
      const timer = setTimeout(() => {
        onSearch(query);
        setIsSearching(false);
      }, debounceMs);

      return () => clearTimeout(timer);
    },
    [onSearch, debounceMs]
  );

  useEffect(() => {
    setIsSearching(true);
    const cleanup = debouncedSearch(searchQuery);
    return cleanup;
  }, [searchQuery, debouncedSearch]);

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Icon name="MagnifyingGlassIcon" size={20} className="text-muted-foreground" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-2 border border-input rounded-md bg-surface text-text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-smooth duration-150"
        />
        {showClearButton && searchQuery && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-text-primary transition-smooth duration-150"
            aria-label="Clear search"
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        )}
        {isSearching && !searchQuery && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="animate-spin">
              <Icon name="ArrowPathIcon" size={20} className="text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchInterface;
