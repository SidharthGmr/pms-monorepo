import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

export interface Crumb {
  label: string;
  href?: string;
}

interface PageBannerProps {
  title: string;
  eyebrow?: string;
  description?: string;
  crumbs?: Crumb[];
  /** Anything that belongs opposite the title - a count, a filter chip, a CTA. */
  aside?: ReactNode;
  className?: string;
}

// The masthead every inner page opens with, so /products, a product page and anything added
// later share one shape. It borrows the dark panel the homepage already uses for WidePromo -
// ruled grid, teal glow, navy wash - which keeps an inner page visibly part of the storefront
// rather than a bare admin-looking list.
export default function PageBanner({ title, eyebrow, description, crumbs, aside, className }: PageBannerProps) {
  return (
    <section className={cn('relative isolate overflow-hidden bg-storefront-surface text-storefront-surface-foreground', className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgb(255_255_255/0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.055)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_75%)]"
      />
      <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-storefront-accent/25 blur-[120px]" />
      <span aria-hidden className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-primary/40 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="min-w-0">
              {eyebrow && <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-storefront-accent">{eyebrow}</span>}
              <h1 className={cn('text-2xl font-extrabold tracking-tight text-storefront-surface-heading sm:text-4xl', eyebrow && 'mt-1.5')}>
                {title}
              </h1>
              {description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-storefront-surface-muted">{description}</p>}
            </div>
          </div>

          {aside && <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div>}
        </div>

        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-xs">
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return (
                  <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                    {index > 0 && <ChevronRight aria-hidden className="h-3.5 w-3.5 text-storefront-surface-muted/70" />}
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="rounded text-storefront-surface-muted transition-colors hover:text-storefront-surface-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-storefront-accent focus-visible:ring-offset-2 focus-visible:ring-offset-storefront-surface"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={isLast ? 'page' : undefined}
                        className={cn('truncate', isLast ? 'font-medium text-storefront-surface-heading' : 'text-storefront-surface-muted')}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>
    </section>
  );
}
