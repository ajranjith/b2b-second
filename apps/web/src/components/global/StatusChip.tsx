import { cn } from "@/lib/utils";
import type { OrderStatus, StockStatus } from "@/types/dealer";
import { Badge } from "@/components/ui/badge";

// === ORDER STATUS CONFIG ===
const orderStatusConfig: Record<
  OrderStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  submitted: {
    label: "Submitted",
    variant: "outline",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  processing: {
    label: "Processing",
    variant: "outline",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  completed: {
    label: "Completed",
    variant: "outline",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    variant: "outline",
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
};

// === STOCK STATUS CONFIG ===
const stockStatusConfig: Record<
  StockStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  in_stock: {
    label: "In Stock",
    variant: "outline",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  low_stock: {
    label: "Low Stock",
    variant: "outline",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  backorder: {
    label: "Backorder",
    variant: "outline",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  unknown: {
    label: "Unknown",
    variant: "outline",
    className: "bg-slate-50 text-slate-500 border-slate-200",
  },
};

// === ORDER STATUS CHIP ===
interface OrderStatusChipProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusChip({ status, className }: OrderStatusChipProps) {
  const config = orderStatusConfig[status];

  return (
    <Badge variant={config.variant} className={cn("font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
}

// === STOCK STATUS CHIP ===
interface StockStatusChipProps {
  status: StockStatus;
  quantity?: number;
  className?: string;
}

export function StockStatusChip({ status, quantity, className }: StockStatusChipProps) {
  const config = stockStatusConfig[status];

  return (
    <Badge variant={config.variant} className={cn("font-medium", config.className, className)}>
      {config.label}
      {quantity !== undefined && status === "in_stock" && (
        <span className="ml-1 opacity-75">({quantity})</span>
      )}
    </Badge>
  );
}

// === GENERIC STATUS CHIP ===
interface StatusChipProps {
  label: string;
  variant?: "info" | "success" | "warning" | "error" | "neutral";
  className?: string;
}

const variantConfig: Record<NonNullable<StatusChipProps["variant"]>, { className: string }> = {
  info: { className: "bg-blue-50 text-blue-700 border-blue-200" },
  success: { className: "bg-green-50 text-green-700 border-green-200" },
  warning: { className: "bg-amber-50 text-amber-700 border-amber-200" },
  error: { className: "bg-red-50 text-red-700 border-red-200" },
  neutral: { className: "bg-slate-50 text-slate-700 border-slate-200" },
};

export function StatusChip({ label, variant = "neutral", className }: StatusChipProps) {
  const config = variantConfig[variant];

  return (
    <Badge variant="outline" className={cn("font-medium", config.className, className)}>
      {label}
    </Badge>
  );
}
