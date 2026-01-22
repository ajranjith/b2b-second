"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type DensityMode = "comfortable" | "dense";
export type SortDirection = "asc" | "desc" | null;

export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  density?: DensityMode;
  onDensityChange?: (density: DensityMode) => void;
  sortBy?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;
  expandable?: boolean;
  renderExpanded?: (row: T) => React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function Table<T extends { id: string | number }>({
  columns,
  data,
  density = "comfortable",
  onDensityChange,
  sortBy,
  sortDirection,
  onSort,
  expandable = false,
  renderExpanded,
  isLoading = false,
  emptyMessage = "No data available",
  className,
}: TableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  const handleSort = (columnKey: string, sortable?: boolean) => {
    if (!sortable || !onSort) return;

    let newDirection: SortDirection = "asc";
    if (sortBy === columnKey) {
      if (sortDirection === "asc") {
        newDirection = "desc";
      } else if (sortDirection === "desc") {
        newDirection = null;
      }
    }

    onSort(columnKey, newDirection);
  };

  const toggleRowExpansion = (rowId: string | number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const getSortIcon = (columnKey: string, sortable?: boolean) => {
    if (!sortable) return null;

    if (sortBy === columnKey) {
      if (sortDirection === "asc") {
        return <ChevronUp className="h-4 w-4 ml-1" />;
      } else if (sortDirection === "desc") {
        return <ChevronDown className="h-4 w-4 ml-1" />;
      }
    }

    return <ChevronsUpDown className="h-4 w-4 ml-1 text-slate-400" />;
  };

  const densityStyles = {
    comfortable: {
      row: "h-14",
      cell: "px-4 py-3",
      text: "text-sm",
    },
    dense: {
      row: "h-10",
      cell: "px-2 py-2",
      text: "text-xs",
    },
  };

  const styles = densityStyles[density];

  if (isLoading) {
    return (
      <div className={cn("w-full overflow-x-auto", className)}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {expandable && <th className={cn(styles.cell, "w-10")} />}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    styles.cell,
                    styles.text,
                    "font-semibold text-slate-700 text-left",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                  )}
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-slate-100 animate-pulse">
                {expandable && (
                  <td className={styles.cell}>
                    <div className="h-4 w-4 bg-slate-200 rounded" />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className={styles.cell}>
                    <div className="h-4 bg-slate-200 rounded" style={{ width: "80%" }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("w-full overflow-x-auto", className)}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {expandable && <th className={cn(styles.cell, "w-10")} />}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    styles.cell,
                    styles.text,
                    "font-semibold text-slate-700 text-left",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                  )}
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length + (expandable ? 1 : 0)} className="py-12 text-center">
                <p className="text-slate-500 text-sm">{emptyMessage}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {expandable && <th className={cn(styles.cell, "w-10")} />}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  styles.cell,
                  styles.text,
                  "font-semibold text-slate-700 text-left",
                  column.align === "center" && "text-center",
                  column.align === "right" && "text-right",
                  column.sortable &&
                    "cursor-pointer hover:bg-slate-100 transition-colors select-none",
                )}
                style={{ width: column.width }}
                onClick={() => handleSort(column.key, column.sortable)}
              >
                <div className="flex items-center">
                  <span>{column.label}</span>
                  {getSortIcon(column.key, column.sortable)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const isExpanded = expandedRows.has(row.id);
            return (
              <>
                <tr
                  key={row.id}
                  className={cn(
                    styles.row,
                    "border-b border-slate-100 hover:bg-slate-50 transition-colors",
                  )}
                >
                  {expandable && (
                    <td className={styles.cell}>
                      <button
                        type="button"
                        onClick={() => toggleRowExpansion(row.id)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                        aria-label={isExpanded ? "Collapse row" : "Expand row"}
                      >
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 text-slate-600 transition-transform",
                            isExpanded && "rotate-90",
                          )}
                        />
                      </button>
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        styles.cell,
                        styles.text,
                        "text-slate-700",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right",
                      )}
                    >
                      {column.render ? column.render(row) : String((row as any)[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
                {expandable && isExpanded && renderExpanded && (
                  <tr key={`${row.id}-expanded`}>
                    <td
                      colSpan={columns.length + 1}
                      className="bg-slate-50 border-b border-slate-200"
                    >
                      <div className="p-4">{renderExpanded(row)}</div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function TableSkeleton({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="w-full overflow-x-auto animate-pulse">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-4 bg-slate-200 rounded" style={{ width: "60%" }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-slate-100">
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <div className="h-4 bg-slate-200 rounded" style={{ width: "80%" }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
