import { cn } from '@/lib/utils';
import { ArrowRight, ArrowUpRight, CalendarDays, Clock3, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { BLOG, BLOG_POSTS } from '@/data/theme.config';

// The posts have no artwork yet, so each cover is drawn rather than left as an empty grey box:
// a tinted wash, a ruled grid and the post's initial. It reads as a designed cover instead of a
// missing image, and a real photograph can drop straight into the same frame later.
const COVERS = [
  { wash: 'from-primary/15 via-primary/5 to-transparent', ink: 'text-primary', chip: 'bg-primary/10 text-primary' },
  { wash: 'from-secondary/20 via-secondary/5 to-transparent', ink: 'text-secondary', chip: 'bg-secondary/15 text-secondary' },
  {
    wash: 'from-amber-500/15 via-amber-500/5 to-transparent',
    ink: 'text-amber-600 dark:text-amber-400',
    chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
];

export default function Blog() {
  const [lead, ...rest] = BLOG_POSTS;
  const leadCover = COVERS[0];

  return (
    <section id="blog" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{BLOG.eyebrow}</span>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{BLOG.title}</h2>
          <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">{BLOG.body}</p>
        </div>
        <a
          href={BLOG.cta.href}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        >
          {BLOG.cta.label}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      {/* One lead story carries the section; the rest sit beside it as a reading list. */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Link
          href={lead.href}
          className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:col-span-3"
        >
          <Cover index={0} title={lead.title} className="aspect-[16/9]" />

          <div className="flex flex-1 flex-col gap-3 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide', leadCover.chip)}>{lead.category}</span>
              <Meta date={lead.date} readMinutes={lead.readMinutes} />
            </div>

            <h3 className="text-xl font-extrabold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl">
              {lead.title}
            </h3>
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{lead.excerpt}</p>

            <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-bold text-primary">
              Read the story
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>

        <ul className="flex flex-col gap-4 lg:col-span-2">
          {rest.map((post, index) => (
            <li key={post.title} className="flex-1">
              <Link
                href={post.href}
                className="group flex h-full gap-4 overflow-hidden rounded-3xl border border-border/70 bg-card p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Cover index={index + 1} title={post.title} className="hidden w-28 shrink-0 rounded-2xl sm:block" />

                <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-1 pr-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        COVERS[(index + 1) % COVERS.length].chip
                      )}
                    >
                      {post.category}
                    </span>
                    <Meta date={post.date} readMinutes={post.readMinutes} />
                  </div>

                  <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{post.excerpt}</p>

                  <span className="mt-auto inline-flex items-center gap-1 pt-1.5 text-xs font-bold text-primary">
                    Read more
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Meta({ date, readMinutes }: { date: string; readMinutes: number }) {
  return (
    <span className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1">
        <CalendarDays className="h-3 w-3" />
        {date}
      </span>
      <span className="flex items-center gap-1">
        <Clock3 className="h-3 w-3" />
        {readMinutes} min read
      </span>
    </span>
  );
}

function Cover({ index, title, className }: { index: number; title: string; className?: string }) {
  const cover = COVERS[index % COVERS.length];

  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden bg-gradient-to-br', cover.wash, className)}>
      <span
        aria-hidden
        className="absolute inset-0 [background-image:linear-gradient(to_right,hsl(var(--foreground)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.05)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />
      <span aria-hidden className={cn('relative select-none text-6xl font-black leading-none opacity-20', cover.ink)}>
        {title.charAt(0)}
      </span>
      <Newspaper aria-hidden className={cn('absolute bottom-3 right-3 h-4 w-4 opacity-40', cover.ink)} />
    </div>
  );
}
