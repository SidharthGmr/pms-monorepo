'use client';

import CardAction from '@/components/common/card-action';
import { Card } from '@/components/ui/card';
import { StatusValues } from '@/enums/status-values.enum';
import { cn } from '@/lib/utils';
import { AttributeDto } from '@pms/types';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Pencil, Ruler, Trash2 } from 'lucide-react';
import { KeyboardEvent } from 'react';

const STATUS_TONE: Record<string, { dot: string; text: string }> = {
  [StatusValues.Published]: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  [StatusValues.Draft]: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  [StatusValues.Trash]: { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400' },
};

interface AttributeCardProps {
  attribute: AttributeDto;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Card layout for the attributes grid: identity and unit up top, status and age along the footer.
// The whole card opens the read-only view; the overlay buttons stop propagation.
export default function AttributeCard({ attribute, onView, onEdit, onDelete }: AttributeCardProps) {
  const tone = STATUS_TONE[attribute.status] ?? { dot: 'bg-muted-foreground', text: 'text-muted-foreground' };
  const trashed = attribute.status === StatusValues.Trash;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onView();
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={onKeyDown}
      aria-label={`View ${attribute.name}`}
      className={cn(
        '!p-0 group relative flex cursor-pointer flex-col overflow-hidden border transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        trashed && 'opacity-70'
      )}
    >
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <CardAction label="View attribute" icon={Eye} onClick={onView} className="hover:bg-primary hover:text-primary-foreground" />
        <CardAction label="Edit attribute" icon={Pencil} onClick={onEdit} className="hover:bg-primary hover:text-primary-foreground" />
        {!trashed && <CardAction label="Delete attribute" icon={Trash2} onClick={onDelete} className="hover:bg-destructive hover:text-destructive-foreground" />}
      </div>

      <div className="flex items-start gap-3 p-4 pr-14">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Ruler className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" title={attribute.name}>
            {attribute.name}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{attribute.unit?.trim() ? `Measured in ${attribute.unit}` : 'No unit'}</p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t px-4 py-2.5 text-[11px]">
        <span className={cn('inline-flex items-center gap-1.5 font-medium', tone.text)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
          {attribute.status}
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium tabular-nums" title="Display order">
            {attribute.displayOrder ?? '—'}
          </span>
          <span className="truncate" title={attribute.createdAt ? new Date(attribute.createdAt).toLocaleString() : undefined}>
            {attribute.createdAt ? formatDistanceToNow(new Date(attribute.createdAt), { addSuffix: true }) : '—'}
          </span>
        </span>
      </div>
    </Card>
  );
}
