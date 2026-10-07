'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { ArrowRight, BadgeCheck, PackageOpen, ShoppingBag, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { HERO } from '../theme.config';

// The three newest sellable SKUs dress the banner, so it is never a stock photo of something
// the store does not sell. Undersized stores simply show fewer tiles.
const COLLAGE_SIZE = 3;

const TILT = ['sm:-rotate-2 sm:translate-y-4', 'sm:z-10 sm:scale-105', 'sm:rotate-2 sm:translate-y-6'];

export default function Hero() {
  const { data, isLoading } = useGetAllPublicProductVariants({ page: 1, recordPerPage: COLLAGE_SIZE, sortBy: 'createdAt', sortDirection: 'DESC' });

  const variants = useMemo(() => data?.data?.data?.data ?? [], [data]);
  const total = data?.data?.data?.totalRecord ?? 0;

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-storefront-hero-from to-storefront-hero-to text-storefront-hero-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgb(255_255_255/0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.09)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_75%)]"
      />
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/15 blur-[110px]" />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_minmax(0,1fr)] lg:px-8 lg:py-20">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {HERO.badge}
          </span>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {HERO.headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="max-w-md text-base text-storefront-hero-foreground/85">{HERO.body}</p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/products">
              <Button size="lg" className="h-12 gap-2 rounded-full bg-storefront-hero-cta px-8 font-bold text-storefront-hero-cta-foreground shadow-lg hover:bg-storefront-hero-cta/90">
                {HERO.cta.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#categories">
              <Button size="lg" variant="outline" className="h-12 rounded-full border-white/40 bg-transparent px-6 font-semibold text-storefront-hero-foreground hover:bg-white/10 hover:text-storefront-hero-foreground">
                Browse categories
              </Button>
            </a>
          </div>

          <dl className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/20 pt-5 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-storefront-hero-foreground/70">Products live</dt>
              <dd className="text-xl font-extrabold tabular-nums">{isLoading ? '—' : total}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-storefront-hero-foreground/70">Stock counts</dt>
              <dd className="text-xl font-extrabold">Real-time</dd>
            </div>
            <div className="flex items-center gap-1.5 font-semibold">
              <BadgeCheck className="h-4 w-4" />
              100% genuine
            </div>
          </dl>
        </div>

        <div className="hidden items-center justify-center gap-4 sm:flex lg:justify-end">
          {isLoading ? (
            Array.from({ length: COLLAGE_SIZE }, (_, index) => (
              <Skeleton key={index} className={cn('h-56 w-40 shrink-0 rounded-2xl bg-white/20', TILT[index])} />
            ))
          ) : variants.length === 0 ? (
            <div className="flex h-56 w-full max-w-sm flex-col items-center justify-center gap-3 rounded-2xl border border-white/25 bg-white/10 text-storefront-hero-foreground/80 backdrop-blur">
              <PackageOpen className="h-10 w-10" />
              <p className="text-sm font-semibold">New stock landing soon</p>
            </div>
          ) : (
            variants.map((variant, index) => {
              const image = variant.images?.[0];
              const price = variant.isOffer && variant.offerPrice != null ? variant.offerPrice : variant.sellingPrice;

              return (
                <Link
                  key={variant.id}
                  href={`/products/${encodeURIComponent(variant.sku)}`}
                  className={cn('group w-36 shrink-0 overflow-hidden rounded-2xl bg-white shadow-2xl transition-transform hover:!scale-110 lg:w-44', TILT[index])}
                >
                  <div className="flex aspect-[4/5] items-center justify-center bg-white p-3">
                    {image ? (
                      // Variant images come from arbitrary CDNs; next/image would need each host in
                      // `next.config.mjs` remotePatterns, so a plain <img> keeps unknown hosts working.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={variant.product?.name ?? variant.name} className="max-h-full w-auto object-contain transition-transform group-hover:scale-105" />
                    ) : (
                      <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="space-y-0.5 border-t px-3 py-2 text-foreground">
                    <p className="truncate text-xs font-semibold">{variant.product?.name ?? variant.name}</p>
                    <p className="text-sm font-bold tabular-nums text-storefront-hero-cta-foreground">{price != null ? formatPrice(price) : 'Price on request'}</p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
