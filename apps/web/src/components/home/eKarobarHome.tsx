'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DataTablePagination } from '@/components/Table/data-table-pagination';
import config from '@/config';
import { ProductDto } from '@/dtos/product.dto';
import { useGetAllPublicProducts } from '@/hooks/service-hooks/useProductService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { ProductFilterParams } from '@/params/product.params';
import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

const NAV_LINKS = [
  { label: 'Products', href: '#products' },
  { label: 'Why us', href: '#why' },
  { label: 'Contact', href: '#footer' },
];

const VALUE_PROPS = [
  { icon: Truck, title: 'Fast delivery', desc: 'Quick dispatch on every order' },
  { icon: ShieldCheck, title: 'Secure checkout', desc: 'Your data stays protected' },
  { icon: BadgeCheck, title: 'Quality assured', desc: 'Only genuine, in-stock items' },
  { icon: Headphones, title: '24/7 support', desc: 'We are here whenever you need' },
];

const FOOTER_COLS = [
  { title: 'Shop', links: ['All products', 'New arrivals', 'Best sellers', 'Offers'] },
  { title: 'Company', links: ['About us', 'Careers', 'Stores', 'Contact'] },
  { title: 'Support', links: ['Help center', 'Track order', 'Returns', 'Privacy'] },
];

export default function EKarobarHome() {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch] = useDebounce(searchText, 600);

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [recordCount, setRecordCount] = useState(0);

  // Server-side filtering + paging via the public products API (same flow as the POS page).
  const [filterParams, setFilterParams] = useState<ProductFilterParams>({
    search: '',
    page: 1,
    recordPerPage: config.recordPerPage,
  });

  const { data: productsResponse, isLoading, isError, isSuccess } = useGetAllPublicProducts(filterParams);

  // productsResponse is the AxiosResponse: .data (body) → .data (ListResponse) → .data (array).
  useEffect(() => {
    if (isSuccess && productsResponse?.data?.data) {
      setProducts(productsResponse.data.data.data ?? []);
      setRecordCount(productsResponse.data.data.totalRecord ?? 0);
    }
  }, [isSuccess, productsResponse]);

  // Push the debounced search term to the API and reset to the first page.
  useEffect(() => {
    setFilterParams((prev) => ({ ...prev, search: debouncedSearch || undefined, page: 1 }));
  }, [debouncedSearch]);

  // Headless table instance drives pagination; products render as cards, not rows.
  const { sorting, onSortingChange } = useTanstackTableSorting<ProductDto>('', 'desc');
  const { onPaginationChange, pagination } = useTanstackTablePagination(filterParams.recordPerPage);

  const table = useCustomDataTable<ProductDto, unknown>({
    columns: [],
    data: products,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil((recordCount || 0) / (filterParams.recordPerPage || 1)),
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
  });

  useEffect(() => {
    setFilterParams((prev) => ({
      ...prev,
      page: pagination.pageIndex + 1,
      recordPerPage: pagination.pageSize,
    }));
  }, [pagination]);

  const getSellingPrice = (p: ProductDto): number => p.currentPrice?.sellingPrice ?? p.price ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ---------------------------------- Header --------------------------------- */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Store className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight text-foreground">eKarobar</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-300 hover:text-foreground hover:after:w-full"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link href="/login">
              <Button variant="ghost" className="font-semibold">
                Log in
              </Button>
            </Link>
            <Link href="/login">
              <Button className="font-semibold">Get Started</Button>
            </Link>
          </div>

          {/* Mobile nav */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="flex h-full flex-col gap-8 py-4">
                  <Link href="/" className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <Store className="h-5 w-5" />
                    </span>
                    <span className="text-lg font-bold">eKarobar</span>
                  </Link>
                  <nav className="flex flex-col gap-1 text-base font-medium">
                    {NAV_LINKS.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ))}
                  </nav>
                  <div className="mt-auto flex flex-col gap-2">
                    <Link href="/login" className="w-full">
                      <Button variant="outline" className="w-full">
                        Log in
                      </Button>
                    </Link>
                    <Link href="/login" className="w-full">
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ----------------------------------- Hero ---------------------------------- */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Decorative, theme-aware background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/60 via-background to-background" />
          <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute right-[-4rem] top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-[-4rem] left-[-4rem] h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <Badge
            variant="secondary"
            className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-xs font-semibold shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Your store, all in one place
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Discover everything in our{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">catalog</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Browse our full range of products at a glance. Fresh stock, clear prices, and a seamless ordering experience — all in one beautiful storefront.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#products">
              <Button size="lg" className="h-12 gap-2 px-7 font-semibold shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">
                Browse Products
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 px-7 font-semibold">
                Sign in to order
              </Button>
            </Link>
          </div>

          {/* Trust row */}
          <div className="mx-auto mt-12 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-muted-foreground">
            {VALUE_PROPS.map((vp) => (
              <span key={vp.title} className="flex items-center gap-2">
                <vp.icon className="h-4 w-4 text-primary" />
                {vp.title}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- Value props ------------------------------ */}
      <section id="why" className="border-b border-border bg-muted/20">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {VALUE_PROPS.map((vp) => (
            <div key={vp.title} className="flex items-start gap-3 bg-background/40 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <vp.icon className="h-5 w-5" />
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">{vp.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{vp.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------- Products -------------------------------- */}
      <section id="products" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <ShoppingBag className="h-3.5 w-3.5" />
              Our catalog
            </span>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">All Products</h2>
              {!isLoading && !isError && (
                <Badge variant="secondary" className="rounded-full font-semibold">
                  {recordCount}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Everything currently available in the store.</p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-12 rounded-xl border-border bg-background pl-10 shadow-sm"
            />
          </div>
        </div>

        {renderProducts()}

        {!isLoading && !isError && recordCount > 0 && (
          <div className="mt-10 border-t border-border pt-6">
            <DataTablePagination table={table} totalRecord={recordCount} loading={isLoading} />
          </div>
        )}
      </section>

      {/* ------------------------------------ CTA ---------------------------------- */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-foreground/10 blur-2xl" />
              <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-primary-foreground/10 blur-2xl" />
            </div>
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">Ready to place your first order?</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/80 sm:text-base">
                Create an account in seconds and start shopping from the full catalog today.
              </p>
              <Link href="/login" className="mt-7 inline-block">
                <Button size="lg" variant="secondary" className="h-12 gap-2 px-7 font-semibold shadow-lg">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------- Footer --------------------------------- */}
      <footer id="footer" className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 space-y-4 lg:col-span-2">
              <Link href="/" className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Store className="h-5 w-5" />
                </span>
                <span className="text-lg font-bold tracking-tight text-foreground">eKarobar</span>
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                A modern storefront to browse products, check live stock and prices, and order with ease.
              </p>
            </div>

            {FOOTER_COLS.map((col) => (
              <div key={col.title} className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} eKarobar. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="transition-colors hover:text-foreground">Terms</a>
              <a href="#" className="transition-colors hover:text-foreground">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  /* ------------------------------- Sub-renderers ------------------------------ */

  function renderProducts() {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="overflow-hidden rounded-2xl border-border p-0">
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Couldn&apos;t load products</p>
            <p className="text-xs text-muted-foreground">Something went wrong. Please try again in a moment.</p>
          </div>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No products found</p>
            <p className="text-xs text-muted-foreground">Try a different search term.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => {
          const soldOut = product.stock <= 0;
          const isLowStock = !soldOut && product.stock <= (product.lowStockThreshold || 5);

          return (
            <Card
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-2xl border-border bg-card p-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
            >
              {/* Image */}
              <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-border bg-muted/40">
                {product.images && product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <Package className="h-10 w-10 text-muted-foreground/40 transition-transform duration-500 group-hover:scale-110" />
                )}

                {/* subtle bottom fade for legibility */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background/40 to-transparent" />

                <div className="absolute left-2.5 top-2.5">
                  {soldOut ? (
                    <Badge
                      variant="outline"
                      className="gap-1.5 rounded-md border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive backdrop-blur"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      Sold out
                    </Badge>
                  ) : isLowStock ? (
                    <Badge
                      variant="outline"
                      className="gap-1.5 rounded-md border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 backdrop-blur dark:text-amber-400"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Low stock
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1.5 rounded-md border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 backdrop-blur dark:text-emerald-400"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      In stock
                    </Badge>
                  )}
                </div>

                {soldOut && <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px]" />}
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="mb-3 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {product.name}
                </h3>

                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Price</span>
                    <span className="text-lg font-bold text-foreground">${getSellingPrice(product).toFixed(2)}</span>
                  </div>

                  {soldOut ? (
                    <Button size="sm" className="h-9 shrink-0 rounded-lg font-semibold" disabled>
                      Sold out
                    </Button>
                  ) : (
                    <Link href="/login" className="shrink-0">
                      <Button size="sm" className="h-9 rounded-lg font-semibold transition-transform group-hover:scale-105">
                        Order
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }
}
