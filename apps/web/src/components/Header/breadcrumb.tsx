'use client';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { Fragment } from 'react';

// "brand-names" -> "Brand Names"; numeric segments (record ids) read as "#12".
const label = (title: string) => {
  if (/^\d+$/.test(title)) return `#${title}`;
  return title
    .replace(/-/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// First crumb is the area root (Admin / Dashboard) and renders as a home icon; the middle crumbs
// only show from `lg` up so the bar never fights the header actions for width.
export function BreadCrumb() {
  const items = useBreadcrumbs();
  if (items.length === 0) return null;

  const [root, ...rest] = items;
  const middle = rest.slice(0, -1);
  const current = rest.length ? rest[rest.length - 1] : null;

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap gap-1 text-xs sm:gap-1.5">
        <BreadcrumbItem>
          {current ? (
            <BreadcrumbLink asChild>
              <Link href={root.link} aria-label={label(root.title)} className="flex items-center text-muted-foreground transition-colors hover:text-foreground">
                <Home className="h-3.5 w-3.5" />
              </Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="flex items-center gap-1.5 font-medium">
              <Home className="h-3.5 w-3.5" />
              {label(root.title)}
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {middle.map((item) => (
          <Fragment key={item.link}>
            <BreadcrumbSeparator className="hidden lg:flex [&>svg]:h-3.5 [&>svg]:w-3.5">
              <ChevronRight />
            </BreadcrumbSeparator>
            <BreadcrumbItem className="hidden lg:flex">
              <BreadcrumbLink asChild>
                <Link href={item.link} className="max-w-[160px] truncate">
                  {label(item.title)}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Fragment>
        ))}

        {current && (
          <>
            <BreadcrumbSeparator className="[&>svg]:h-3.5 [&>svg]:w-3.5">
              <ChevronRight />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[200px] truncate font-medium">{label(current.title)}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
