'use client';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ListPageHeaderProps {
  /** Lucide icon shown in the tinted tile beside the title. */
  icon?: React.ElementType;
  title: string;
  /** One line under the title, usually the live record count. */
  description?: ReactNode;
  /** Buttons rendered on the right; they wrap under the title on phones. */
  actions?: ReactNode;
  className?: string;
}

// The heading row for a listing page: icon tile, title, count line, primary actions.
// Use it with `ListToolbar` below it, e.g. the Brand Names page.
export default function ListPageHeader({ icon: Icon, title, description, actions, className }: ListPageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
