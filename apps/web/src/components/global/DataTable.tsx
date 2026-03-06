"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TableDensity } from "@/types/dealer";
import { Button } from "@/components/ui/button";
import { List, LayoutGrid } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  density?: TableDensity;
  allowDensityToggle?: boolean;
  onDensityChange?: (density: TableDensity) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
  headerClassName?: string;
}

/**
 * Data Table Component
 *
 * Enhanced table with:
 * - Comfortable / Dense row heights
 * - Density toggle (persists per user)
 * - Row click handler
 * - Custom column rendering
 * - Loading/Empty states
 */
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  density: controlledDensity,
  allowDensityToggle = true,
  onDensityChange,
  onRowClick,
  emptyMessage = "No data available",
  className,
  headerClassName,
}: DataTableProps<T>) {
  const [localDensity, setLocalDensity] = useState<TableDensity>("comfortable");

  const density = controlledDensity || localDensity;

  const handleDensityToggle = () => {
    const newDensity = density === "comfortable" ? "dense" : "comfortable";
    setLocalDensity(newDensity);
    onDensityChange?.(newDensity);
  };

  const densityStyles = {
    comfortable: "py-4 px-4",
    dense: "py-2 px-3",
  };

  const headerDensityStyles = {
    comfortable: "py-3 px-4",
    dense: "py-2 px-3",
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Density Toggle */}
      {allowDensityToggle && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleDensityToggle} className="gap-2">
            {density === "comfortable" ? (
              <>
                <List className="w-4 h-4" />
                Dense View
              </>
            ) : (
              <>
                <LayoutGrid className="w-4 h-4" />
                Comfortable View
              </>
            )}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className={cn("bg-slate-50", headerClassName)}>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    headerDensityStyles[density],
                    "font-semibold text-slate-900",
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12 text-slate-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "hover:bg-slate-50 transition-colors",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(densityStyles[density], column.className)}
                    >
                      {column.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton for DataTable
 */
interface DataTableSkeletonProps {
  columns: number;
  rows?: number;
  density?: TableDensity;
}

export function DataTableSkeleton({
  columns,
  rows = 5,
  density = "comfortable",
}: DataTableSkeletonProps) {
  const densityStyles = {
    comfortable: "h-16",
    dense: "h-12",
  };

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i} className="py-3 px-4">
                <div className="h-4 bg-slate-200 rounded animate-pulse" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <TableCell key={colIdx} className={densityStyles[density]}>
                  <div className="h-4 bg-slate-100 rounded animate-pulse" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
