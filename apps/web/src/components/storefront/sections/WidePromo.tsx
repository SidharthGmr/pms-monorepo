import { Button } from '@/components/ui/button';
import { WIDE_PROMO } from '../theme.config';

export default function WidePromo() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-storefront-surface p-8 text-storefront-surface-foreground sm:flex-row sm:p-10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-storefront-accent">{WIDE_PROMO.eyebrow}</span>
          <h3 className="mt-2 text-2xl font-extrabold leading-tight text-storefront-surface-heading sm:text-3xl">{WIDE_PROMO.title}</h3>
          <p className="mt-2 max-w-md text-sm text-storefront-surface-muted">{WIDE_PROMO.body}</p>
        </div>
        <a href={WIDE_PROMO.cta.href}>
          <Button
            size="lg"
            className="h-12 rounded-full bg-storefront-accent px-8 font-bold text-storefront-accent-foreground hover:bg-storefront-accent/90"
          >
            {WIDE_PROMO.cta.label}
          </Button>
        </a>
      </div>
    </section>
  );
}
