"use client";

import { useState } from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import type { CartItem } from "@/types/dealer";
import { StockStatusChip } from "@/components/global";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CartTableProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  className?: string;
}

/**
 * Cart Table Component
 *
 * Editable cart table with:
 * - Part details (Part No, JagAlt, Description)
 * - Unit price
 * - Inline quantity editor (stepper + input)
 * - Line total
 * - Remove button with confirmation
 */
export function CartTable({ items, onUpdateQuantity, onRemoveItem, className }: CartTableProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    items.reduce((acc, item) => ({ ...acc, [item.id]: item.quantity }), {}),
  );

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    const validQuantity = Math.max(1, newQuantity);
    setQuantities((prev) => ({ ...prev, [itemId]: validQuantity }));
    onUpdateQuantity(itemId, validQuantity);
  };

  const incrementQuantity = (itemId: string) => {
    const current = quantities[itemId] || 1;
    handleQuantityChange(itemId, current + 1);
  };

  const decrementQuantity = (itemId: string) => {
    const current = quantities[itemId] || 1;
    if (current > 1) {
      handleQuantityChange(itemId, current - 1);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn("rounded-lg border border-slate-200 overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-semibold">Part Details</TableHead>
            <TableHead className="font-semibold text-right">Unit Price</TableHead>
            <TableHead className="font-semibold text-center">Quantity</TableHead>
            <TableHead className="font-semibold text-right">Line Total</TableHead>
            <TableHead className="font-semibold text-right w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-slate-50">
              {/* Part Details */}
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{item.product.lrNo}</span>
                    {item.product.jagAlt && (
                      <Badge variant="outline" className="text-xs">
                        {item.product.jagAlt}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 max-w-md">{item.product.description}</p>
                  <div className="mt-1">
                    <StockStatusChip
                      status={item.product.availability}
                      quantity={item.product.quantityAvailable}
                    />
                  </div>
                </div>
              </TableCell>

              {/* Unit Price */}
              <TableCell className="text-right font-medium text-slate-900">
                {formatCurrency(item.product.dealerPrice)}
              </TableCell>

              {/* Quantity Editor */}
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => decrementQuantity(item.id)}
                    disabled={quantities[item.id] <= 1}
                    className="h-9 w-9 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={quantities[item.id] || item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                    className="h-9 w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => incrementQuantity(item.id)}
                    className="h-9 w-9 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>

              {/* Line Total */}
              <TableCell className="text-right font-semibold text-slate-900 text-lg">
                {formatCurrency(item.lineTotal)}
              </TableCell>

              {/* Remove Button */}
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Item</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove{" "}
                        <span className="font-medium">{item.product.lrNo}</span> from your cart?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onRemoveItem(item.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
