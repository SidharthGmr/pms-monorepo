'use client';
import { cn } from '@/lib/utils';
import { StatusValues } from '@/enums/status-values.enum';
import { Check, Eye, EyeOff } from 'lucide-react';

// The Published / Draft choice as two tap targets instead of a select, shared by the brand and
// category forms. Each status owns its colour so the selected option reads as "green = live" or
// "amber = hidden" at a glance.
const STATUS_OPTIONS = [
  {
    value: StatusValues.Published,
    label: 'Published',
    icon: Eye,
    active: 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20',
    iconActive: 'bg-emerald-500 text-white',
    iconIdle: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    check: 'bg-emerald-500',
  },
  {
    value: StatusValues.Draft,
    label: 'Draft',
    icon: EyeOff,
    active: 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20',
    iconActive: 'bg-amber-500 text-white',
    iconIdle: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    check: 'bg-amber-500',
  },
];

interface StatusCardsProps {
  value?: string | null;
  onChange: (value: string) => void;
  className?: string;
}

export default function StatusCards({ value, onChange, className }: StatusCardsProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-2 sm:grid-cols-2', className)} role="radiogroup" aria-label="Status">
      {STATUS_OPTIONS.map(({ icon: Icon, ...option }) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-left transition-all duration-150',
              'hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              active ? option.active : 'border-input hover:border-muted-foreground/40'
            )}
          >
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors', active ? option.iconActive : option.iconIdle)}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 pr-5 text-sm font-semibold leading-tight">{option.label}</span>
            <span
              aria-hidden
              className={cn(
                'absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full text-white transition-all duration-150',
                active ? cn(option.check, 'scale-100 opacity-100') : 'scale-50 opacity-0'
              )}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
