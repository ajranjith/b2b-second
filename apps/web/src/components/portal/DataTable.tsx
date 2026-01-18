'use client';

import { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

type Column = {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
};

type Row = {
  id: string;
  cells: React.ReactNode[];
  onClick?: () => void;
};

type DataTableProps = {
  columns: Column[];
  rows: Row[];
  density?: 'comfortable' | 'dense';
};

export function DataTable({ columns, rows, density = 'comfortable' }: DataTableProps) {
  const tableRef = useRef<HTMLTableElement>(null);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTableElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const focusable = tableRef.current?.querySelectorAll<HTMLTableRowElement>('tbody tr[tabindex="0"]');
    if (!focusable || focusable.length === 0) return;
    const currentIndex = Array.from(focusable).findIndex((row) => row === document.activeElement);
    const nextIndex =
      event.key === 'ArrowDown' ? Math.min(focusable.length - 1, currentIndex + 1) : Math.max(0, currentIndex - 1);
    focusable[nextIndex]?.focus();
  }, []);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table ref={tableRef} className="w-full text-sm" onKeyDown={handleKeyDown}>
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 font-semibold',
                  column.align === 'right' && 'text-right',
                  column.align === 'center' && 'text-center'
                )}
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={row.id}
              tabIndex={0}
              onClick={row.onClick}
              className={cn(
                'transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2',
                row.onClick ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/40',
                density === 'dense' ? 'text-sm' : 'text-base'
              )}
            >
              {row.cells.map((cell, index) => (
                <td
                  key={`${row.id}-${index}`}
                  className={cn(
                    'px-4',
                    density === 'dense' ? 'py-2' : 'py-3',
                    columns[index]?.align === 'right' && 'text-right',
                    columns[index]?.align === 'center' && 'text-center'
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
