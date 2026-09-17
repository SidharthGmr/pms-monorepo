import { ShoppingBag } from 'lucide-react';
import { PROMO_TILES } from '../theme.config';

export default function PromoTiles() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        {PROMO_TILES.map((tile) => (
          <div key={tile.title} className={`relative overflow-hidden rounded-2xl p-6 ${tile.tone}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{tile.badge}</span>
            <h3 className="mt-2 max-w-[60%] text-lg font-extrabold leading-tight">{tile.title}</h3>
            <p className="mt-2 text-sm font-semibold opacity-90">From {tile.from}</p>
            <a href="#all-products" className="mt-4 inline-block rounded-full bg-background/90 px-4 py-1.5 text-xs font-bold text-foreground">
              Shop now
            </a>
            <ShoppingBag className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 opacity-15" />
          </div>
        ))}
      </div>
    </section>
  );
}
