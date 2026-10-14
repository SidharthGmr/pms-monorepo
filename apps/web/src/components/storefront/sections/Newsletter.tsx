'use client';

import { Button } from '@/components/ui/button';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { NEWSLETTER } from '@/data/theme.config';
import { useSubscribePublic } from '@/hooks/service-hooks/useSubscriberService';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { BellRing, CheckCircle2, Mail } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { FORM_ACCESS_COOKIE, storeAccessCookie } from '@/lib/page-access';

// Sits between the light brand strip and the dark footer, so it is a brand-gradient card on a
// plain section rather than another full-width band - otherwise it would merge into the footer.
export default function Newsletter() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const mutation = useSubscribePublic();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const response = await mutation.mutateAsync({ email });
    if (response && (response.status === 200 || response.status === 201)) {
      // Unlocks any CMS page conditioned on subscribing (see lib/page-access.ts).
      const formToken = (response.data?.data as { formToken?: string } | undefined)?.formToken;
      if (formToken) storeAccessCookie(FORM_ACCESS_COOKIE, formToken);
      // 200 means the address was already on the list; say so instead of pretending it is new.
      setDone(response.status === 200 ? 'You are already on the list.' : 'Subscribed - see you in your inbox.');
    } else {
      setError(unitOfService.ErrorHandlerService.getErrorMessage(response));
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary px-6 py-12 text-white shadow-xl sm:px-10 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgb(255_255_255/0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.08)_1px,transparent_1px)] [background-size:38px_38px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-[100px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-[110px]" />

        <div className="relative mx-auto max-w-xl text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur">
            <BellRing className="h-5 w-5" />
          </span>

          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">{NEWSLETTER.eyebrow}</p>
          <h2 className="mt-1.5 text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">{NEWSLETTER.headline}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80">{NEWSLETTER.body}</p>

          {done ? (
            <p className="mx-auto mt-7 flex w-full max-w-md items-center justify-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-semibold text-white backdrop-blur">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              {done}
            </p>
          ) : (
          <form className="mx-auto mt-7 w-full max-w-md" onSubmit={submit}>
            {/* One button, positioned twice: from `sm` it is lifted out of flow and sits inside
                the pill on the right; below that it drops back under the field at full width,
                where a button tucked into a narrow input would leave no room to type. */}
            {/* A native input, not the shared one: that component wraps the field in its own
                bordered box, which would sit over this pill and hide the icon. */}
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-6 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={mutation.isPending}
                placeholder={NEWSLETTER.placeholder}
                aria-label="Email address"
                className="h-12 w-full rounded-full border-0 bg-white pl-11 pr-4 text-sm text-foreground shadow-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-storefront-accent sm:pr-[8.75rem]"
              />
              <Button
                type="submit"
                loading={mutation.isPending}
                className="mt-2.5 h-12 w-full rounded-full bg-primary px-7 font-bold text-primary-foreground shadow-sm hover:bg-primary/90 sm:absolute sm:right-1.5 sm:top-1.5 sm:mt-0 sm:h-9 sm:w-auto sm:px-6"
              >
                {NEWSLETTER.cta}
              </Button>
            </div>
            {error && (
              <p role="alert" className="mt-2.5 text-xs font-semibold text-rose-100">
                {error}
              </p>
            )}
          </form>
          )}

          <p className="mt-3.5 text-xs text-white/65">{NEWSLETTER.note}</p>
        </div>
      </div>
    </section>
  );
}
