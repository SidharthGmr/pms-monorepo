'use client';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';

function Row({ label, value, muted }: { label: string; value: Date | string; muted?: boolean }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="w-[3.25rem] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">{label}</span>
      <span className={cn('truncate text-xs tabular-nums', muted ? 'text-muted-foreground' : 'font-medium text-foreground')}>{formatDate(value)}</span>
    </span>
  );
}

interface RecordTimestampsProps {
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  className?: string;
}

export default function RecordTimestamps({ createdAt, updatedAt, className }: RecordTimestampsProps) {
  if (!createdAt && !updatedAt) return <span className="text-muted-foreground/60">—</span>;
  return (
    <div className={cn('flex flex-col gap-0 whitespace-nowrap', className)}>
      {updatedAt && <Row label="Updated" value={updatedAt} />}
      {createdAt && <Row label="Added" value={createdAt} muted={!!updatedAt} />}
    </div>
  );
}
