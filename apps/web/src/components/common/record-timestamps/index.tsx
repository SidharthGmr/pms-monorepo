'use client';

import { Clock3, CalendarDays } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function Row({ label, value, muted }: { label: string; value: Date | string; muted?: boolean }) {
  const Icon = muted ? CalendarDays : Clock3;

  const exactDate = new Date(value);
  const fullDate = !Number.isNaN(exactDate.getTime())
    ? exactDate.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : String(value);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex w-fit items-center gap-2 cursor-default">
          <Icon className={cn('h-3.5 w-3.5 shrink-0', muted ? 'text-muted-foreground/60' : 'text-muted-foreground')} />

          <span className={cn('text-xs tabular-nums', muted ? 'text-muted-foreground' : 'font-medium text-foreground')}>
            {label} {formatDate(value)}
          </span>
        </div>
      </TooltipTrigger>

      <TooltipContent side="top" className="text-xs">
        {fullDate}
      </TooltipContent>
    </Tooltip>
  );
}

interface RecordTimestampsProps {
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  className?: string;
}

export default function RecordTimestamps({ createdAt, updatedAt, className }: RecordTimestampsProps) {
  if (!createdAt && !updatedAt) {
    return <span className="text-muted-foreground/60">—</span>;
  }

  return (
    <div className={cn('flex flex-col gap-2 whitespace-nowrap', className)}>
      {updatedAt && <Row label="Updated" value={updatedAt} />}

      {createdAt && <Row label="Added" value={createdAt} muted={!!updatedAt} />}
    </div>
  );
}
