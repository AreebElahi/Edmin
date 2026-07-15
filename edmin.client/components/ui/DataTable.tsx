'use client';

import React from 'react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  className?: string;
}

/**
 * M365-style flat data table.
 * Dense rows, thin dividers, no shadows.
 */
export default function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  loading = false,
  emptyText = 'No records found.',
  rowKey,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`bg-surface border border-border rounded-[2px] overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr className="border-b border-border bg-surface-hover">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={col.width ? { width: col.width } : undefined}
                className={`px-4 py-2.5 text-left text-[10px] font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap ${col.className ?? ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-[#EDEBE9]">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center">
                <div className="flex items-center justify-center gap-2 text-text-secondary text-sm">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-[2px] animate-spin" />
                  Loading...
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-sm text-text-muted"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr
                key={rowKey ? rowKey(row) : idx}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-background transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-4 py-2.5 text-sm text-text-primary ${col.className ?? ''}`}
                  >
                    {col.render
                      ? col.render(row)
                      : String(row[col.key as string] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
