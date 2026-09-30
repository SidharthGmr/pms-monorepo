'use client';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ListPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  loading?: boolean;
  pageSizes?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const ELLIPSIS = '…';

// 1 … 4 5 [6] 7 8 … 20 - always shows the first, last and a window around the current page.
function pageItems(current: number, pageCount: number): (number | typeof ELLIPSIS)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const window = new Set<number>([1, pageCount, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => window.add(p));
  if (current >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((p) => window.add(p));

  const pages = Array.from(window).filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const items: (number | typeof ELLIPSIS)[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) items.push(ELLIPSIS);
    items.push(p);
  });
  return items;
}

export default function ListPagination({
  page,
  pageSize,
  total,
  loading,
  pageSizes = [12, 24, 48, 96],
  onPageChange,
  onPageSizeChange,
}: ListPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const canPrev = page > 1 && !loading;
  const canNext = page < pageCount && !loading;

  // Keep the current size selectable even if it is not one of the presets (e.g. from the URL).
  const sizes = pageSizes.includes(pageSize) ? pageSizes : [...pageSizes, pageSize].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="whitespace-nowrap">Per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-8 w-[76px]" aria-label="Items per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {sizes.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="whitespace-nowrap tabular-nums">
          {total === 0 ? 'No results' : `${from}–${to} of ${total}`}
        </span>
      </div>

      <nav aria-label="Pagination" className="flex items-center justify-between gap-1 md:justify-end">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={!canPrev} onClick={() => onPageChange(1)} aria-label="First page">
          <ChevronsLeft />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={!canPrev} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft />
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {pageItems(page, pageCount).map((item, i) =>
            item === ELLIPSIS ? (
              <span key={`e-${i}`} className="w-8 text-center text-sm text-muted-foreground">
                {ELLIPSIS}
              </span>
            ) : (
              <Button
                key={item}
                variant={item === page ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8 tabular-nums"
                disabled={loading}
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
              >
                {item}
              </Button>
            )
          )}
        </div>
        <span className="px-2 text-sm tabular-nums text-muted-foreground sm:hidden">
          {page} / {pageCount}
        </span>

        <Button variant="outline" size="icon" className="h-8 w-8" disabled={!canNext} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={!canNext} onClick={() => onPageChange(pageCount)} aria-label="Last page">
          <ChevronsRight />
        </Button>
      </nav>
    </div>
  );
}
