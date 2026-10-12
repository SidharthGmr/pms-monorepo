'use client';
import { cn } from '@/lib/utils';

export interface StatusTone {
  label: string;
  dot: string;
  text: string;
  soft: string;
}

const FALLBACK: StatusTone = { label: 'Unknown', dot: 'bg-muted-foreground', text: 'text-muted-foreground', soft: 'bg-muted' };

export const STATUS_TONES: Record<string, StatusTone> = {
  PUBLISHED: { label: 'Published', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', soft: 'bg-emerald-500/10' },
  DRAFT: { label: 'Draft', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', soft: 'bg-amber-500/10' },
  TRASH: { label: 'Trash', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', soft: 'bg-rose-500/10' },
  DELETED: { label: 'Deleted', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', soft: 'bg-rose-500/10' },
  INREVIEW: { label: 'In review', dot: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-400', soft: 'bg-sky-500/10' },
  REJECTED: { label: 'Rejected', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', soft: 'bg-rose-500/10' },
  ACTIVE: { label: 'Active', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', soft: 'bg-emerald-500/10' },
  INACTIVE: { label: 'Inactive', dot: 'bg-zinc-400', text: 'text-muted-foreground', soft: 'bg-muted' },
};

const normalize = (status?: string | null) => String(status ?? '').toUpperCase().replace(/[\s_-]/g, '');

export const toneForStatus = (status?: string | null): StatusTone => STATUS_TONES[normalize(status)] ?? { ...FALLBACK, label: status || FALLBACK.label };

interface StatusBadgeProps {
  status?: string | null;
  label?: string;
  tone?: StatusTone;
  variant?: 'dot' | 'soft';
  size?: 'xs' | 'sm';
  className?: string;
}

export default function StatusBadge({ status, label, tone, variant = 'soft', size = 'sm', className }: StatusBadgeProps) {
  const resolved = tone ?? toneForStatus(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        size === 'xs' ? 'text-[11px]' : 'text-xs',
        variant === 'soft' ? cn('rounded-full px-2 py-0.5 font-semibold', resolved.soft, resolved.text) : resolved.text,
        className
      )}
    >
      <span className={cn('shrink-0 rounded-full', size === 'xs' ? 'h-1 w-1' : 'h-1.5 w-1.5', resolved.dot)} aria-hidden />
      {label ?? resolved.label}
    </span>
  );
}
