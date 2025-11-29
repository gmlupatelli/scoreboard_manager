'use client';

import { useState, useMemo } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import Icon from '@/components/ui/AppIcon';

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  emptyMessage = 'No results found',
  className = '',
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === value) || null;
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    const lowerQuery = query.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(lowerQuery)
    );
  }, [options, query]);

  const handleChange = (option: SelectOption | null) => {
    onChange(option?.value || '');
    setQuery('');
  };

  return (
    <Combobox
      value={selectedOption}
      onChange={handleChange}
      onClose={() => setQuery('')}
    >
      <div className={`relative ${className}`}>
        <div className="relative">
          <ComboboxInput
            className="w-full px-3 py-2 pr-10 bg-background border border-border rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            displayValue={(option: SelectOption | null) => option?.label || ''}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Icon name="ChevronDownIcon" size={16} className="text-text-secondary" />
          </ComboboxButton>
        </div>

        <ComboboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background border border-border shadow-lg focus:outline-none">
          {filteredOptions.length === 0 && query !== '' ? (
            <div className="px-4 py-3 text-sm text-text-secondary">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <ComboboxOption
                key={option.value}
                value={option}
                className={({ active, selected }) =>
                  `relative cursor-pointer select-none px-4 py-2 text-sm ${
                    active ? 'bg-primary/10 text-primary' : 'text-text-primary'
                  } ${selected ? 'font-medium' : ''}`
                }
              >
                {({ selected }) => (
                  <div className="flex items-center justify-between">
                    <span className={selected ? 'font-medium' : ''}>
                      {option.label}
                    </span>
                    {selected && (
                      <Icon name="CheckIcon" size={16} className="text-primary" />
                    )}
                  </div>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
