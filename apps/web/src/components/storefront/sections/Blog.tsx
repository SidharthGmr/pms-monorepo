import { Card } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { BLOG_POSTS } from '../theme.config';
import SectionHeading from './SectionHeading';

export default function Blog() {
  return (
    <section id="blog" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <SectionHeading title="Our latest blog" />
      <div className="grid gap-6 md:grid-cols-3">
        {BLOG_POSTS.map((post) => (
          <Card key={post.title} className="overflow-hidden rounded-2xl border-border p-0">
            <div className="flex aspect-[16/10] items-center justify-center bg-muted/50">
              <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <div className="space-y-2 p-5">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {post.date}
              </span>
              <h3 className="line-clamp-2 text-sm font-bold leading-snug">{post.title}</h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{post.excerpt}</p>
              <span className="inline-block pt-1 text-xs font-bold uppercase tracking-wide text-primary">Read more</span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
