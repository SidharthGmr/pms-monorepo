'use client';
import { KeyboardEvent, ReactNode } from 'react';
import { Eye, ImageOff, LucideIcon, Pencil, Trash2 } from 'lucide-react';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { cn } from '@/lib/utils';
import CardAction from '../card-action';

export interface CustomeCardProps {
  image?: string | null;
  monogram?: string;
  title: string;
  type?: string;
  status?: string;
  statusVariant?: BadgeProps['variant'];
  displayOrder?: number | null;
  date?: Date | string | null;
  showTime?: boolean;
  subtitle?: string;
  subtitleIcon?: LucideIcon;
  entityLabel?: string;
  imageFit?: 'cover' | 'contain';
  emptyImageText?: string;
  footer?: ReactNode;
  isDeleted?: boolean;
  dimmed?: boolean;
  className?: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// A generic listing card for admin grid views: image, title, type, status, display order, date and
// the view/edit/delete overlay actions. The whole card triggers `onView`; the overlay buttons stop
// propagation (see CardAction) so edit and delete never fall through to it. `isDeleted` is for
// soft-deleted rows - it dims the card, marks it "Deleted" and drops the delete action; `dimmed`
// only greys a record out (a trashed one, say) and leaves its own status and actions alone.
export function CustomeCard({
  image,
  monogram,
  title,
  type,
  status,
  statusVariant = 'default',
  displayOrder,
  date,
  showTime = false,
  subtitle,
  subtitleIcon: SubtitleIcon,
  entityLabel = 'item',
  imageFit = 'cover',
  emptyImageText = 'No image',
  footer,
  isDeleted = false,
  dimmed = false,
  className,
  onView,
  onEdit,
  onDelete,
}: CustomeCardProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const formattedDate = date && unitOfService.DateTimeService.convertToLocalDate(date, showTime);

  const onOpen = onView ?? onEdit;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onOpen || e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <Card
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      aria-label={onOpen ? `${onView ? 'View' : 'Edit'} ${title}` : undefined}
      className={cn(
        'p-0 md:p-0',
        'group relative flex flex-col overflow-hidden border transition-all duration-200',
        onOpen && 'cursor-pointer',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        (isDeleted || dimmed) && 'opacity-70 grayscale hover:grayscale-0',
        isDeleted && 'border-dashed',
        className
      )}
    >
      <div className="relative flex h-28 items-center justify-center bg-gradient-to-b from-muted/60 to-muted/20">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            loading="lazy"
            className={cn(
              'transition-transform duration-200 group-hover:scale-105',
              imageFit === 'cover' ? 'h-full w-full object-cover' : 'max-h-full max-w-[80%] object-contain p-4 drop-shadow-sm'
            )}
          />
        ) : monogram ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold uppercase tracking-wide text-primary">
            {monogram}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
            <ImageOff className="h-6 w-6" />
            <span className="text-[10px]">{emptyImageText}</span>
          </div>
        )}

        {(isDeleted || status) && (
          <Badge variant={isDeleted ? 'destructive' : statusVariant} className="absolute left-2 top-2 px-1.5 py-0 text-[10px] shadow-sm">
            {isDeleted ? 'Deleted' : status}
          </Badge>
        )}

        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
          {onView && (
            <CardAction label={`View ${entityLabel}`} icon={Eye} onClick={onView} className="hover:bg-primary hover:text-primary-foreground" />
          )}
          {onEdit && (
            <CardAction label={`Edit ${entityLabel}`} icon={Pencil} onClick={onEdit} className="hover:bg-primary hover:text-primary-foreground" />
          )}
          {onDelete && !isDeleted && (
            <CardAction
              label={`Delete ${entityLabel}`}
              icon={Trash2}
              onClick={onDelete}
              className="hover:bg-destructive hover:text-destructive-foreground"
            />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 border-t px-3 py-2.5">
        <p className="truncate text-sm font-semibold leading-tight" title={title}>
          {title}
        </p>
        {type && (
          <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground" title={type}>
            {type}
          </p>
        )}
        {subtitle && (
          <p className="inline-flex items-center gap-1 truncate text-[11px] text-muted-foreground">
            {SubtitleIcon && <SubtitleIcon className="h-3 w-3 shrink-0" />}
            <span className="truncate">{subtitle}</span>
          </p>
        )}
        {(displayOrder != null || formattedDate) && (
          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            {displayOrder != null && (
              <span className="rounded bg-muted px-1.5 py-0.5 font-medium tabular-nums" title="Display order">
                Order {displayOrder}
              </span>
            )}
            {formattedDate && (
              <span className="truncate" title="Date added">
                {formattedDate}
              </span>
            )}
          </div>
        )}
      </div>

      {footer && <div className="mt-auto flex items-center justify-between gap-2 border-t px-3 py-2.5 text-[11px] text-muted-foreground">{footer}</div>}
    </Card>
  );
}

export default CustomeCard;
