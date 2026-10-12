import ContactForm from '@/components/storefront/contact-form';
import PageBanner from '@/components/storefront/page-banner';
import config from '@/config';
import { ABOUT, BRAND, CONTACT } from '@/data/theme.config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Contact us - ${config.appName}`,
  description: CONTACT.banner.description,
};

export default function ContactUsPage() {
  return (
    <main>
      <PageBanner
        eyebrow={CONTACT.banner.eyebrow}
        title={CONTACT.banner.title}
        description={CONTACT.banner.description}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Contact us' }]}
      />

      {/* The form carries the page; the rail beside it holds every other way in, read from the
          same BRAND block the footer and the about page use. */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
          <ContactForm />

          <aside className="space-y-4">
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
              <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{CONTACT.aside.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{CONTACT.aside.body}</p>

              <ul className="mt-5 space-y-4">
                {ABOUT.contact.map(({ icon: Icon, label, key }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
                      <span className="block break-words text-sm font-medium text-foreground">{BRAND[key]}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-border/70 bg-muted/30 p-6 sm:p-7">
              <h3 className="text-sm font-bold text-foreground">Asking about an order?</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Include the order number from your invoice (it looks like <span className="font-mono text-xs text-foreground">ORD-20261012-1234</span>) and we can answer
                in one reply instead of two.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
