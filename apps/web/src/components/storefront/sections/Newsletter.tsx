'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';
import { NEWSLETTER } from '../theme.config';

export default function Newsletter() {
  return (
    <section className="bg-storefront-accent">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <div className="flex items-center gap-3 text-storefront-accent-foreground">
          <Mail className="h-8 w-8" />
          <p className="text-lg font-extrabold">{NEWSLETTER.headline}</p>
        </div>
        {/* No subscribe endpoint yet - the submit is inert until one exists. */}
        <form className="flex w-full max-w-md gap-2" onSubmit={(event) => event.preventDefault()}>
          <Input
            type="email"
            required
            placeholder={NEWSLETTER.placeholder}
            aria-label={NEWSLETTER.placeholder}
            className="h-11 rounded-full border-0 bg-background text-foreground"
          />
          <Button
            type="submit"
            className="h-11 shrink-0 rounded-full bg-storefront-surface px-6 font-bold text-storefront-surface-heading hover:bg-storefront-surface/90"
          >
            {NEWSLETTER.cta}
          </Button>
        </form>
      </div>
    </section>
  );
}
