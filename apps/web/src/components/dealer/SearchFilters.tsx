"use client";

import { useState } from "react";
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { SearchFilters as SearchFiltersType, StockStatus } from "@/types/dealer";
import { cn } from "@/lib/utils";

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  onSearch: () => void;
  isLoading?: boolean;
  resultCount?: number;
  className?: string;
}

const availabilityOptions: { value: StockStatus; label: string }[] = [
  { value: "in_stock", label: "In Stock" },
  { value: "low_stock", label: "Low Stock" },
  { value: "backorder", label: "Backorder" },
];

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "part_number", label: "Part Number" },
];

/**
 * Search Filters Component
 *
 * Sticky filter bar with:
 * - Search input (Part No / JagAlt / Description)
 * - Availability filters (chips)
 * - Price range slider
 * - Sort dropdown
 * - Active filter count badge
 */
export function SearchFilters({
  filters,
  onFiltersChange,
  onSearch,
  isLoading = false,
  resultCount,
  className,
}: SearchFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(filters.query);

  const handleQueryChange = (value: string) => {
    setLocalQuery(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, query: localQuery });
    onSearch();
  };

  const handleAvailabilityToggle = (status: StockStatus) => {
    const current = filters.availability || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    onFiltersChange({ ...filters, availability: updated });
  };

  const handleSortChange = (sortBy: SearchFiltersType["sortBy"]) => {
    onFiltersChange({ ...filters, sortBy });
  };

  const handleClearFilters = () => {
    setLocalQuery("");
    onFiltersChange({
      query: "",
      availability: [],
      priceRange: undefined,
      sortBy: "relevance",
    });
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.availability && filters.availability.length > 0) {
      count += filters.availability.length;
    }
    if (filters.priceRange) count += 1;
    if (filters.sortBy && filters.sortBy !== "relevance") count += 1;
    return count;
  };

  const filterCount = activeFilterCount();

  return (
    <div
      className={cn(
        "sticky top-[112px] z-[1040] bg-white border-b border-slate-200 shadow-sm",
        className,
      )}
    >
      <div className="px-6 py-4">
        {/* Main Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="search"
              placeholder="Search by Part No, JagAlt, or Description..."
              value={localQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </form>

        {/* Filter Chips Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Availability Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Stock:</span>
            {availabilityOptions.map((option) => {
              const isActive = filters.availability?.includes(option.value);
              return (
                <Badge
                  key={option.value}
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer hover:opacity-80 transition-opacity",
                    isActive && "bg-primary text-white",
                  )}
                  onClick={() => handleAvailabilityToggle(option.value)}
                >
                  {option.label}
                  {isActive && <X className="ml-1 w-3 h-3" />}
                </Badge>
              );
            })}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Sort:</span>
            <Select value={filters.sortBy || "relevance"} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters Toggle */}
          <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Advanced
                {filterCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {filterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Advanced Filters</h4>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange?.min || ""}
                      onChange={(e) => {
                        const min = parseFloat(e.target.value) || undefined;
                        onFiltersChange({
                          ...filters,
                          priceRange: {
                            min: min || 0,
                            max: filters.priceRange?.max || 0,
                          },
                        });
                      }}
                      className="h-9"
                    />
                    <span className="text-slate-500">to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange?.max || ""}
                      onChange={(e) => {
                        const max = parseFloat(e.target.value) || undefined;
                        onFiltersChange({
                          ...filters,
                          priceRange: {
                            min: filters.priceRange?.min || 0,
                            max: max || 0,
                          },
                        });
                      }}
                      className="h-9"
                    />
                  </div>
                </div>

                <Separator />

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    handleClearFilters();
                    setIsAdvancedOpen(false);
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear All (if filters active) */}
          {filterCount > 0 && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-slate-600 hover:text-slate-900"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </>
          )}

          {/* Result Count */}
          {resultCount !== undefined && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <span className="text-sm text-slate-600">
                {resultCount} {resultCount === 1 ? "result" : "results"}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
