// components/common/section-card/index.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ArrowRight, LucideIcon, Plus } from 'lucide-react';
import Link from 'next/link';
import { MouseEventHandler, ReactNode } from 'react';

export interface CTAAction {
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  label: string;
  icon?: 'arrow' | 'plus' | 'none';
  variant?: 'link' | 'button' | 'ghost';
  className?: string;
  iconClassName?: string;
  target?: '_blank' | '_self';
  disabled?: boolean;
}

interface SectionCardProps {
  title: string | ReactNode;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  maxHeight?: number;
  showScroll?: boolean;
  headerClassName?: string;
  contentClassName?: string;
  cta?: CTAAction;
  ctaTitle?: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  showViewAll?: boolean;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export default function SectionCard({
  title,
  icon: Icon,
  children,
  className,
  maxHeight = 72,
  showScroll = true,
  headerClassName,
  contentClassName,
  cta,
  ctaTitle,
  href,
  onClick,
  showViewAll = false,
  viewAllHref = '#',
  viewAllLabel = 'View All',
}: SectionCardProps) {
  // Determine CTA action
  const getCTA = (): CTAAction | null => {
    // If cta is provided directly, use it
    if (cta) return cta;

    // If href or ctaTitle is provided, build CTA
    if (href || ctaTitle) {
      return {
        href: href || '#',
        label: ctaTitle || 'View All',
        icon: 'arrow',
        variant: 'link',
      };
    }

    // If showViewAll is true, use default View All
    if (showViewAll) {
      return {
        href: viewAllHref,
        label: viewAllLabel,
        icon: 'arrow',
        variant: 'link',
      };
    }

    return null;
  };

  const renderCTA = (action: CTAAction) => {
    const iconMap = {
      arrow: <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />,
      plus: <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />,
      none: null,
    };

    const iconElement = action.icon ? iconMap[action.icon] : null;

    const baseClassName = cn(
      'flex items-center gap-1 transition-all duration-200',
      action.variant === 'link' && 'text-sm font-medium text-primary hover:text-primary/80 group',
      action.variant === 'button' && 'inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90',
      action.variant === 'ghost' && 'text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md px-3 py-1.5',
      action.className,
      action.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
    );

    // If onClick is provided without href, render as button
    if (action.onClick && !action.href) {
      return (
        <button
          onClick={action.onClick as MouseEventHandler<HTMLButtonElement>}
          className={baseClassName}
          disabled={action.disabled}
          type="button"
        >
          {action.label}
          {iconElement}
        </button>
      );
    }

    // Render as Link
    return (
      <Link
        href={action.href || '#'}
        onClick={action.onClick as MouseEventHandler<HTMLAnchorElement>}
        className={baseClassName}
        target={action.target || '_self'}
        prefetch={false}
      >
        {action.label}
        {iconElement}
      </Link>
    );
  };

  const ctaAction = getCTA();

  return (
    <Card className={cn('p-4 rounded-2xl border border-border/50 bg-card shadow-sm flex flex-col gap-4', className)}>
      <CardHeader
        className={cn(
          'p-0 flex-row justify-between items-center pb-2 border-b border-border/50',
          headerClassName
        )}
      >
        <CardTitle className="flex items-center gap-2">
          {Icon && (
            <div className="rounded-sm bg-primary/10 p-1.5">
              <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
          )}
          <span className="text-base font-bold text-foreground">{title}</span>

        </CardTitle>
        {ctaAction && (
          <div className="flex items-center gap-2">
            {renderCTA(ctaAction)}
          </div>
        )}
      </CardHeader>

      <CardContent
        className={cn(showScroll ? 'p-0' : 'p-1', 'p-0 pt-1 flex-1', contentClassName)}
      >
        {showScroll ? (
          <ScrollArea className={cn('overflow-y-auto pe-2', `max-h-72 ${maxHeight}`)}>
            {children}
          </ScrollArea>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
