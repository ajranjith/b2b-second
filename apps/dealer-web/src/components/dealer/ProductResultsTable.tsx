"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Minus, Image as ImageIcon } from "lucide-react";
import type { Product } from "@repo/lib";
import { StockStatusChip } from "@/components/global";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Input } from "@repo/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui";
import { cn } from "@/lib/utils";

interface ProductResultsTableProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
  className?: string;
}

/**
 * Product Results Table Component
 *
 * Displays search results with:
 * - Part No (LRNo) + JagAlt badge
 * - Description (2-line clamp)
 * - Dealer Price
 * - Availability + ETA
 * - Qty Stepper
 * - Add to Cart button
 * - Expandable row for details (supersession, notes, image)
 */
export function ProductResultsTable({
  products,
  onAddToCart,
  className,
}: ProductResultsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const toggleRow = (productId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedRows(newExpanded);
  };

  const getQuantity = (productId: string) => quantities[productId] || 1;

  const incrementQuantity = (productId: string) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 1) + 1,
    }));
  };

  const decrementQuantity = (productId: string) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) - 1),
    }));
  };

  const setQuantity = (productId: string, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, value),
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  if (products.length === 0) {
    return (
      <div
        className={cn(
          "text-center py-12 rounded-lg border-2 border-dashed border-slate-300",
          className,
        )}
      >
        <p className="text-slate-600 mb-2">No products found</p>
        <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-slate-200 overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-8"></TableHead>
            <TableHead className="font-semibold">Part No</TableHead>
            <TableHead className="font-semibold">Description</TableHead>
            <TableHead className="font-semibold text-right">Price</TableHead>
            <TableHead className="font-semibold">Availability</TableHead>
            <TableHead className="font-semibold text-center">Quantity</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isExpanded = expandedRows.has(product.id);
            const hasDetails = product.supersededBy || product.notes || product.imageUrl;
            const quantity = getQuantity(product.id);

            return (
              <>
                {/* Main Row */}
                <TableRow key={product.id} className="hover:bg-slate-50">
                  {/* Expand Toggle */}
                  <TableCell>
                    {hasDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(product.id)}
                        className="h-6 w-6 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>

                  {/* Part Number + JagAlt */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-slate-900">{product.lrNo}</div>
                      {product.jagAlt && (
                        <Badge variant="outline" className="text-xs">
                          {product.jagAlt}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Description */}
                  <TableCell>
                    <p className="text-sm text-slate-700 line-clamp-2 max-w-md">
                      {product.description}
                    </p>
                  </TableCell>

                  {/* Price */}
                  <TableCell className="text-right font-semibold text-slate-900">
                    {formatCurrency(product.dealerPrice)}
                  </TableCell>

                  {/* Availability */}
                  <TableCell>
                    <div className="space-y-1">
                      <StockStatusChip
                        status={product.availability}
                        quantity={product.quantityAvailable}
                      />
                      {product.eta && (
                        <p className="text-xs text-slate-500">
                          ETA: {new Date(product.eta).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Quantity Stepper */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => decrementQuantity(product.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(product.id, parseInt(e.target.value) || 1)}
                        className="h-8 w-16 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => incrementQuantity(product.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>

                  {/* Add to Cart */}
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => onAddToCart(product, quantity)}
                      disabled={product.availability === "unknown"}
                    >
                      Add to Cart
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Expanded Details Row */}
                {isExpanded && hasDetails && (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-slate-50 py-4">
                      <div className="flex gap-6 px-4">
                        {/* Image Placeholder */}
                        {product.imageUrl && (
                          <div className="flex-shrink-0">
                            <div className="w-32 h-32 bg-slate-200 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-slate-400" />
                            </div>
                          </div>
                        )}

                        {/* Details */}
                        <div className="flex-1 space-y-3">
                          {product.supersededBy && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-900 mb-1">
                                Supersession
                              </h4>
                              <p className="text-sm text-slate-600">
                                This part has been superseded by:{" "}
                                <span className="font-medium">{product.supersededBy}</span>
                              </p>
                            </div>
                          )}

                          {product.notes && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-900 mb-1">Notes</h4>
                              <p className="text-sm text-slate-600">{product.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
