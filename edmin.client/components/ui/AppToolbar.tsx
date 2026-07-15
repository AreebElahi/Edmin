'use client';

import React, { useRef } from 'react';
import { Search } from 'lucide-react';

interface AppToolbarProps {
  /** Current search value */
  searchValue?: string;
  /** Called on every search input change */
  onSearch?: (value: string) => void;
  /** Search box placeholder */
  searchPlaceholder?: string;
  /** Filter chips / dropdowns — rendered left of the search */
  filters?: React.ReactNode;
  /** Action buttons — rendered on the right */
  actions?: React.ReactNode;
  /** Extra wrapper classes */
  className?: string;
}

/**
 * M365-style command toolbar.
 * Flat white bar with search box, optional filter slots, and action buttons.
 */
export default function AppToolbar({
  searchValue = '',
  onSearch,
  searchPlaceholder = 'Search...',
  filters,
  actions,
  className = '',
}: AppToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border px-4 py-2.5 rounded-[2px] ${className}`}
    >
      {/* Left: filters + search */}
      <div className="flex items-center gap-2 flex-1 flex-wrap">
        {filters}
        {onSearch !== undefined && (
          <div
            className="relative flex items-center"
            onClick={() => inputRef.current?.focus()}
          >
            <Search
              className="absolute left-2.5 w-3.5 h-3.5 text-text-muted pointer-events-none"
              strokeWidth={1.5}
            />
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-[2px] bg-surface-hover text-text-primary placeholder-[#A19F9D] focus:outline-none focus:border-primary focus:bg-surface transition-colors min-w-[200px]"
            />
          </div>
        )}
      </div>

      {/* Right: action buttons */}
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
