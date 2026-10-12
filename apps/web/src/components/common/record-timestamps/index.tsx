'use client';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';

type DateValue = Date | string | null | undefined;

const UNTOUCHED_MS = 1000;

function Row({ label, value, muted }: { label: string; value: Date; muted?: boolean }) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  return (
    <span className="flex items-baseline gap-2">
      <span className="w-[3.25rem] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">{label}</span>
      <span className={cn('truncate text-xs tabular-nums', muted ? 'text-muted-foreground' : 'font-medium text-foreground')}>
        {unitOfService.DateTimeService.formatDate(value as Date)}
      </span>
    </span>
  );
}

interface RecordTimestampsProps {
  createdAt?: DateValue;
  updatedAt?: DateValue;
  className?: string;
}

export default function RecordTimestamps({ createdAt, updatedAt, className }: RecordTimestampsProps) {
  const created = createdAt ? new Date(createdAt) : null;
  let updated = updatedAt ? new Date(updatedAt) : null;

  if (created && updated && Math.abs(updated.getTime() - created.getTime()) < UNTOUCHED_MS) updated = null;

  if (!created && !updated) return <span className="text-muted-foreground/60">—</span>;

  return (
    <div className={cn('flex flex-col gap-0 whitespace-nowrap', className)}>
      {updated && <Row label="Updated" value={updated} />}
      {created && <Row label="Added" value={created} muted={!!updated} />}
    </div>
  );
}
