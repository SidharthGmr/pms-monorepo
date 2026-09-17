import { TRUST_ITEMS } from '../theme.config';

export default function TrustStrip() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 sm:px-6 lg:grid-cols-4 lg:px-8">
        {TRUST_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <item.icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold sm:text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
