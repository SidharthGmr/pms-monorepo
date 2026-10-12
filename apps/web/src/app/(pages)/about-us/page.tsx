import PageBanner from '@/components/storefront/page-banner';
import config from '@/config';
import { ABOUT, BRAND, TRUST_ITEMS } from '@/data/theme.config';
import { ArrowRight } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `About us - ${config.appName}`,
  description: ABOUT.banner.description,
};

export default function AboutUsPage() {
  return (
    <main>
      <PageBanner
        eyebrow={ABOUT.banner.eyebrow}
        title={ABOUT.banner.title}
        description={ABOUT.banner.description}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'About us' }]}
      />

      {/* The story carries the page; the panel beside it is the same promise in four lines, for
          anyone who is scanning rather than reading. */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{ABOUT.story.eyebrow}</span>
            <h2 className="mt-1.5 max-w-xl text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{ABOUT.story.title}</h2>
            <div className="mt-5 space-y-4">
              {ABOUT.story.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
            <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">What you can count on</h3>
            <ul className="mt-5 space-y-4">
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 border-t border-border/70 pt-5 text-sm leading-relaxed text-muted-foreground">{BRAND.tagline}</p>
          </aside>
        </div>
      </section>

      <section className="border-y border-border/70 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">How we keep the catalogue honest</h2>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">Four things the shop does differently, and none of them are optional.</p>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT.pillars.map(({ icon: Icon, title, body }) => (
              <li key={title} className="group rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-bold text-foreground">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Numbered, because the order is the point: price and stock are fixed to the order at
          the moment it is raised, not at the moment it ships. */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">From the shelf to your door</h2>

        <ol className="relative mt-8 grid gap-6 md:grid-cols-3">
          <span aria-hidden className="absolute left-0 right-0 top-6 hidden border-t border-dashed border-border md:block" />
          {ABOUT.steps.map(({ icon: Icon, title, body }, index) => (
            <li key={title} className="relative">
              <div className="flex items-center gap-3">
                <span aria-hidden className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-card text-primary shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Step {index + 1}</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">{title}</h3>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ABOUT.contact.map(({ icon: Icon, label, key }) => (
            <div key={label} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-0.5 break-words text-sm font-medium text-foreground">{BRAND[key]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-storefront-surface px-6 py-12 text-storefront-surface-foreground shadow-xl sm:px-10">
          <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-storefront-accent/25 blur-[120px]" />
          <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/40 blur-[120px]" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="max-w-lg text-2xl font-extrabold tracking-tight text-storefront-surface-heading sm:text-3xl">{ABOUT.cta.title}</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-storefront-surface-muted">{ABOUT.cta.body}</p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Link
                href={ABOUT.cta.primary.href}
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-storefront-accent px-7 text-sm font-bold text-storefront-accent-foreground shadow-lg transition-all hover:bg-storefront-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-storefront-accent focus-visible:ring-offset-2 focus-visible:ring-offset-storefront-surface"
              >
                {ABOUT.cta.primary.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={ABOUT.cta.secondary.href}
                className="inline-flex h-12 items-center rounded-full border border-storefront-surface-border px-6 text-sm font-semibold text-storefront-surface-heading transition-colors hover:bg-white/5"
              >
                {ABOUT.cta.secondary.label}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
