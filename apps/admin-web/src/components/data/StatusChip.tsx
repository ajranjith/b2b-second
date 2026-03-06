import { cn } from "@/lib/utils";

export type StatusVariant =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "urgent"
  | "in_stock"
  | "low_stock"
  | "backorder"
  | "out_of_stock"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

interface StatusChipProps {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  urgent: "bg-red-100 text-red-800 border-red-300 font-semibold",
  in_stock: "bg-green-50 text-green-700 border-green-200",
  low_stock: "bg-amber-50 text-amber-700 border-amber-200",
  backorder: "bg-blue-50 text-blue-700 border-blue-200",
  out_of_stock: "bg-red-50 text-red-700 border-red-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export function StatusChip({ variant, children, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
