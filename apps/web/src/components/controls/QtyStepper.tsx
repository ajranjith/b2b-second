'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QtyStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  step = 1,
  className,
  disabled = false,
}: QtyStepperProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  return (
    <div className={cn('inline-flex items-center border border-slate-200 rounded-lg', className)}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className="p-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4 text-slate-600" />
      </button>
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        min={min}
        max={max}
        className="w-16 text-center border-x border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 disabled:bg-slate-50 disabled:cursor-not-allowed"
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className="p-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4 text-slate-600" />
      </button>
    </div>
  );
}
