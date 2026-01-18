import { cn } from '@/lib/utils';

type StatusChipProps = {
  label: string;
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
};

const toneClasses: Record<NonNullable<StatusChipProps['tone']>, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
};

export function StatusChip({ label, tone = 'slate' }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        toneClasses[tone]
      )}
    >
      {label}
    </span>
  );
}
