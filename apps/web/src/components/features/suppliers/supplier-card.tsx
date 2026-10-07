'use client';

import CardAction from '@/components/common/card-action';
import { Card } from '@/components/ui/card';
import { SupplierDto } from '@/dtos/supplier.dto';
import { StatusValues } from '@/enums/status-values.enum';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Mail, MapPin, Pencil, Phone, Trash2, UserRound } from 'lucide-react';

const STATUS_TONE: Record<string, { dot: string; text: string }> = {
  [StatusValues.Published]: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  [StatusValues.Draft]: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  [StatusValues.Trash]: { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400' },
};

const TONES = [
  'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
];

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || '?';

interface SupplierCardProps {
  supplier: SupplierDto;
  onEdit: () => void;
  onDelete: () => void;
}

// Card layout for the suppliers grid: who they are up top, how to reach them in the middle,
// display order and when they were added along the footer.
export default function SupplierCard({ supplier, onEdit, onDelete }: SupplierCardProps) {
  const tone = STATUS_TONE[supplier.status];
  const avatarTone = TONES[supplier.name.length % TONES.length];

  return (
    <Card className="group relative !p-0 overflow-hidden transition-shadow hover:shadow-md">
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <CardAction label={`Edit ${supplier.name}`} icon={Pencil} onClick={onEdit} className="hover:bg-primary hover:text-primary-foreground" />
        <CardAction label={`Delete ${supplier.name}`} icon={Trash2} onClick={onDelete} className="hover:bg-destructive hover:text-destructive-foreground" />
      </div>

      <div className="flex items-start gap-3 border-b bg-muted/30 p-4">
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold', avatarTone)}>{initials(supplier.name)}</span>
        <div className="min-w-0 flex-1 pr-14">
          <button type="button" onClick={onEdit} className="block w-full truncate text-left text-sm font-semibold hover:underline" title={supplier.name}>
            {supplier.name}
          </button>
          <span className={cn('mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium', tone?.text ?? 'text-muted-foreground')}>
            <span className={cn('h-1.5 w-1.5 rounded-full', tone?.dot ?? 'bg-muted-foreground')} />
            {supplier.status}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 p-4">
        <span className="flex items-center gap-1.5 text-xs">
          <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {supplier.contactPerson ? <span className="truncate">{supplier.contactPerson}</span> : <span className="text-muted-foreground/60">No contact person</span>}
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {supplier.email ? (
            <a href={`mailto:${supplier.email}`} className="min-w-0 truncate text-foreground/80 hover:text-primary hover:underline" title={supplier.email}>
              {supplier.email}
            </a>
          ) : (
            <span className="text-muted-foreground/60">No email</span>
          )}
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {supplier.phone ? (
            <a href={`tel:${supplier.phone}`} className="truncate text-foreground/80 hover:text-primary hover:underline">
              {supplier.phone}
            </a>
          ) : (
            <span className="text-muted-foreground/60">No phone</span>
          )}
        </span>
        <span className="flex items-start gap-1.5 text-xs">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {supplier.address ? (
            <span className="line-clamp-2 text-muted-foreground" title={supplier.address}>
              {supplier.address}
            </span>
          ) : (
            <span className="text-muted-foreground/60">No address</span>
          )}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          Order
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium tabular-nums text-foreground">{supplier.displayOrder ?? '—'}</span>
        </span>
        <span className="truncate text-[11px] text-muted-foreground" title={supplier.createdAt ? new Date(supplier.createdAt).toLocaleString() : undefined}>
          {supplier.createdAt ? `Added ${formatDistanceToNow(new Date(supplier.createdAt), { addSuffix: true })}` : '—'}
        </span>
      </div>
    </Card>
  );
}
