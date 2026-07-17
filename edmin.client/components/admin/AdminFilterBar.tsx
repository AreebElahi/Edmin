import { Search } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDefinition {
  id: string;
  label: string;
  icon?: React.ElementType;
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
  className?: string;
}

interface AdminFilterBarProps {
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  filters: FilterDefinition[];
}

export default function AdminFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters
}: AdminFilterBarProps) {
  return (
    <div className="p-4 sm:p-6 border-b border-border bg-surface-hover/50 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
      <div className="relative w-full lg:w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-surface border border-border pl-11 pr-4 py-3 rounded-[2px] outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium text-sm sm:text-base"
        />
      </div>
      {filters && filters.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
          {filters.map((filter) => (
            <div key={filter.id} className="flex flex-1 sm:flex-none items-center justify-between sm:justify-start gap-2 bg-surface px-4 py-3 rounded-[2px] border border-border shadow-none text-xs sm:text-sm font-semibold">
              <div className="flex items-center gap-2">
                  {filter.icon && <filter.icon className="w-4 h-4 text-text-muted" />}
                  <span>{filter.label}</span>
              </div>
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className={`bg-transparent outline-none ml-2 text-primary font-bold ${filter.className || ''}`}
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
