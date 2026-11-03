'use client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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

const BACK_BUTTON = 'h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:text-foreground';
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
        {showBack &&
          (backHref ? (
            <Button asChild variant="outline" size="icon" className={BACK_BUTTON} aria-label="Go back" title="Go back">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="light"
              size="icon"
              className={BACK_BUTTON}
              aria-label="Go back"
              title="Go back"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ))}
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
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {/* Inline only where there is room; with no chip to tap, it stays inline everywhere. */}
          {description && <p className={cn('text-sm text-muted-foreground', Icon && 'hidden sm:block')}>{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
