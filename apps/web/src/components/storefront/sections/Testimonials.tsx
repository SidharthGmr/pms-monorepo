import { cn } from '@/lib/utils';
import { Quote, Star } from 'lucide-react';
import { TESTIMONIALS } from '@/data/theme.config';

const MAX_STARS = 5;

// Each card takes the next tint for its avatar, so three quotes read as three people rather
// than three copies of the same block.
const TINTS = ['bg-primary/10 text-primary', 'bg-secondary/15 text-secondary', 'bg-amber-500/15 text-amber-600 dark:text-amber-400'];

export default function Testimonials() {
  return (
    <section className="bg-muted/40 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-9 max-w-xl text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">What buyers say</span>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Our clients say</h2>
          <p className="mt-2 text-sm text-muted-foreground">Feedback from people who ordered from this store.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {TESTIMONIALS.map((item, index) => (
            <figure
              key={item.name}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <span aria-hidden className="absolute right-5 top-5 text-primary/10 transition-colors group-hover:text-primary/20">
                <Quote className="h-9 w-9 fill-current" />
              </span>

              <div className="flex items-center gap-0.5" aria-label={`Rated ${item.rating} out of ${MAX_STARS}`}>
                {Array.from({ length: MAX_STARS }, (_, star) => (
                  <Star
                    key={star}
                    aria-hidden
                    className={cn('h-4 w-4', star < item.rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30')}
                  />
                ))}
              </div>

              <blockquote className="relative mt-4 flex-1 text-sm leading-relaxed text-foreground/85">&ldquo;{item.quote}&rdquo;</blockquote>

              <figcaption className="mt-5 flex items-center gap-3 border-t border-border/70 pt-4">
                <span
                  className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold', TINTS[index % TINTS.length])}
                >
                  {item.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
