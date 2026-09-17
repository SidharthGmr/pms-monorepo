import { BRANDS } from '../theme.config';

export default function Brands() {
  return (
    <section className="border-y border-border bg-card py-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-6 px-4 sm:px-6 lg:px-8">
        {BRANDS.map((brand) => (
          <span key={brand} className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
            {brand}
          </span>
        ))}
      </div>
    </section>
  );
}
