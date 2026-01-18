'use client';

import { Minus, Plus } from 'lucide-react';

type QtyStepperProps = {
  value: number;
  min?: number;
  onChange: (value: number) => void;
};

export function QtyStepper({ value, min = 1, onChange }: QtyStepperProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        value={value}
        onChange={(event) => onChange(Math.max(min, Number(event.target.value) || min))}
        className="w-10 text-center text-sm font-semibold text-slate-700 focus-visible:outline-none"
        aria-label="Quantity"
      />
      <button
        type="button"
        className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
