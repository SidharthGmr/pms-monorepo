import { Card } from '@/components/ui/card';
import { TESTIMONIALS } from '../theme.config';
import SectionHeading from './SectionHeading';

export default function Testimonials() {
  return (
    <section className="bg-muted/40 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Our clients say" />
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <Card key={item.name} className="rounded-2xl border-border bg-card p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {item.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
