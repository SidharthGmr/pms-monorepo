import { cn } from '@/lib/utils';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { WIDE_PROMO } from '../theme.config';

// A full-width dark panel between two light sections. Its accents come from the storefront
// accent token, which is the teal half of the brand pair - the navy primary would be reading
// against a near-black surface.
export default function WidePromo() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="relative isolate overflow-hidden rounded-3xl bg-storefront-surface px-6 py-12 text-storefront-surface-foreground shadow-xl sm:px-10 sm:py-14 lg:px-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.06)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_72%)]"
        />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-storefront-accent/25 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-primary/40 blur-[120px]" />

        <div className="relative grid gap-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-14">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-storefront-accent/30 bg-storefront-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-storefront-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-storefront-accent" />
              {WIDE_PROMO.eyebrow}
            </span>

            <h3 className="mt-4 max-w-xl text-2xl font-extrabold leading-tight tracking-tight text-storefront-surface-heading sm:text-4xl">{WIDE_PROMO.title}</h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-storefront-surface-muted sm:text-base">{WIDE_PROMO.body}</p>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5">
              {WIDE_PROMO.points.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm font-medium text-storefront-surface-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-storefront-accent/15 text-storefront-accent">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
            <Link
              href={WIDE_PROMO.cta.href}
              className={cn(
                'group inline-flex h-12 items-center gap-2 rounded-full bg-storefront-accent px-7 text-sm font-bold text-storefront-accent-foreground shadow-lg',
                'transition-all hover:bg-storefront-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-storefront-accent focus-visible:ring-offset-2 focus-visible:ring-offset-storefront-surface'
              )}
            >
              {WIDE_PROMO.cta.label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/products" className="text-xs font-semibold text-storefront-surface-muted underline-offset-4 hover:text-storefront-surface-heading hover:underline">
              See what is in stock today
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
