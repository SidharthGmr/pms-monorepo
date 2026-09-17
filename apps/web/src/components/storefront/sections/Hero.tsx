import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { HERO } from '../theme.config';

type HeroProps = {
  /** Newest SKU's own photo, so the banner is never stale. Undefined until the list loads. */
  imageUrl?: string;
  imageAlt?: string;
};

export default function Hero({ imageUrl, imageAlt = '' }: HeroProps) {
  return (
    <section className="bg-gradient-to-r from-storefront-hero-from to-storefront-hero-to text-storefront-hero-foreground">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div className="space-y-5">
          <span className="inline-block rounded bg-storefront-hero-foreground/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
            {HERO.badge}
          </span>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {HERO.headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="max-w-md text-storefront-hero-foreground/85">{HERO.body}</p>
          <a href={HERO.cta.href} className="inline-block">
            <Button
              size="lg"
              className="h-12 rounded-full bg-storefront-hero-cta px-8 font-bold text-storefront-hero-cta-foreground hover:bg-storefront-hero-cta/90"
            >
              {HERO.cta.label}
            </Button>
          </a>
        </div>
        <div className="hidden justify-center lg:flex">
          {imageUrl ? (
            // Variant images come from arbitrary CDNs; next/image would need each host in
            // `next.config.mjs` remotePatterns, so a plain <img> keeps unknown hosts working.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={imageAlt} className="max-h-72 w-auto object-contain drop-shadow-2xl" />
          ) : (
            <ShoppingBag className="h-40 w-40 text-storefront-hero-foreground/30" />
          )}
        </div>
      </div>
    </section>
  );
}
