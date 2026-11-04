'use client';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { ReactNode, useEffect, useState } from 'react';

interface ListPageHeaderProps {
  icon?: React.ElementType;
  title: string;
  /** The back button leads every header by default; this removes it entirely. */
  hideBack?: boolean;
  /** Where back goes. Without it the button walks the browser history instead. */
  backHref?: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const CHIP = 'h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary';

export default function ListPageHeader({ icon: Icon, title, hideBack, backHref, description, actions, className }: ListPageHeaderProps) {
  const router = useRouter();

  const [canGoBack, setCanGoBack] = useState(false);
  useEffect(() => {
    if (!hideBack) setCanGoBack(window.history.length > 1);
  }, [hideBack]);

  const showBack = !hideBack && (!!backHref || canGoBack);

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {Icon &&
          (description ? (
            <>
              {/* Small screens keep only the chip; tapping it discloses the description. */}
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className={cn(CHIP, 'flex sm:hidden')} aria-label={`About ${title}`}>
                    <Icon className="h-5 w-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" sideOffset={8} className="w-72 rounded-lg p-3 text-sm text-muted-foreground sm:hidden">
                  {description}
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <>{/* Icon without a description: nothing to disclose, so no chip at all. */}</>
          ))}
        <div className="min-w-0">
          <CardTitle className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</CardTitle>
          {description && <CardDescription className={cn('text-xs text-muted-foreground', Icon && 'hidden sm:block')}>{description}</CardDescription>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showBack && (
          <Button type="button" variant="light" aria-label="Go back" title="Go back" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
        {actions && <>{actions}</>}
      </div>
    </div>
  );
}
