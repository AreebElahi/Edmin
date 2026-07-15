'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Optional short text under the value (e.g. "vs last month") */
  subtext?: string;
  /** Optional badge text (e.g. "+12") */
  trend?: string;
  /** icon background color class — defaults to M365 blue tint */
  iconColor?: string;
  /** Full-width click handler */
  onClick?: () => void;
  className?: string;
}

/**
 * M365-style flat stat card.
 * Uses only Tailwind utilities so it works before FluentProvider is available.
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
  iconColor = 'text-primary',
  onClick,
  className = '',
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-border p-5 flex flex-col gap-3 rounded-[2px] hover:border-border-hover transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex justify-between items-start">
        <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.5} />
        {trend !== undefined && (
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-primary-light text-primary rounded-[2px]">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-semibold text-text-primary mt-0.5 tabular-nums">{value}</h3>
        {subtext && (
          <p className="text-[11px] text-text-muted mt-0.5">{subtext}</p>
        )}
      </div>
    </div>
  );
}
