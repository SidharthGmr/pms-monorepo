import { ChevronRight } from 'lucide-react';

export default function SectionHeading({ title, href, cta = 'View all' }: { title: string; href?: string; cta?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
      {href && (
        <a href={href} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
          {cta}
          <ChevronRight className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
