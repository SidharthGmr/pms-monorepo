'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import config from '@/config';
import { ProductVariantListItemDto } from '@/dtos/product-variant.dto';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { ProductVariantFilterParams } from '@/params/product-variant.params';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Headphones,
  Heart,
  LayoutGrid,
  Mail,
  MapPin,
  Menu,
  Package,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

/* -------------------------------------------------------------------------- */
/*  Presentation copy. There is no CMS behind the API yet, so the promo tiles,  */
/*  testimonials, blog and brand strip are static - these are the blocks to     */
/*  wire up to real content next. Everything product-shaped comes from the API. */
/* -------------------------------------------------------------------------- */

const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Shop', href: '#all-products' },
  { label: 'Popular', href: '#popular' },
  { label: 'New arrivals', href: '#new-arrivals' },
  { label: 'Blog', href: '#blog' },
  { label: 'About us', href: '#footer' },
];

const TRUST_ITEMS = [
  { icon: BadgeCheck, label: '100% genuine products' },
  { icon: Truck, label: 'Free domestic shipping' },
  { icon: Tag, label: 'Offers and discounts' },
  { icon: RotateCcw, label: '7 days free returns' },
];

const PROMO_TILES = [
  { title: 'Big savings on headphones', from: '₹2,999', tone: 'bg-amber-400 text-amber-950', badge: 'Up to 30% off' },
  { title: 'Best styles for everyday', from: '₹1,499', tone: 'bg-sky-600 text-white', badge: 'Up to 20% off' },
  { title: 'Home and living picks', from: '₹4,999', tone: 'bg-rose-600 text-white', badge: 'Up to 25% off' },
];

const TESTIMONIALS = [
  { quote: 'Reliable product, consistently delivers. Ordering was simple and it arrived ahead of the estimate.', name: 'Stefanie Rashford', role: 'Founder' },
  { quote: 'Excellent product, A+ customer service. The team answered every question before I bought.', name: 'Augusta Wind', role: 'Web Designer' },
  { quote: 'Impressive quality, durable and reliable. Exactly what was described on the listing.', name: 'Reema Ghurde', role: 'Manager' },
];

const BLOG_POSTS = [
  { date: 'July 3, 2026', title: 'The most innovative things happening with online retail', excerpt: 'How storefronts are changing as inventory, pricing and fulfilment move closer together.' },
  { date: 'July 3, 2026', title: 'Seven answers to the most frequently asked questions', excerpt: 'The questions shoppers ask most often before placing a first order, answered plainly.' },
  { date: 'July 3, 2026', title: 'Meet the people behind the products you buy', excerpt: 'A look at the suppliers and makers who keep the shelves stocked week after week.' },
];

const BRANDS = ['EVM', 'HUAWEI', 'CONNECT', 'HACKETT', 'RIYAN', 'VERCELLI'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first', sortBy: 'createdAt', sortOrder: 'desc' as const },
  { value: 'sku-asc', label: 'SKU: A to Z', sortBy: 'sku', sortOrder: 'asc' as const },
  { value: 'sku-desc', label: 'SKU: Z to A', sortBy: 'sku', sortOrder: 'desc' as const },
];

/** Pastel grounds for category tiles that have no image of their own. */
const CATEGORY_TONES = ['bg-emerald-100', 'bg-sky-100', 'bg-rose-100', 'bg-amber-100', 'bg-violet-100', 'bg-teal-100', 'bg-orange-100'];

/* --------------------------------- helpers -------------------------------- */

const wholeRupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const withPaise = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatPrice = (value: number): string => (Number.isInteger(value) ? wholeRupees : withPaise).format(value);

/** `{ clr: 'PNK', strg: '64GB' }` reads as "PNK · 64GB" - what tells one SKU from another. */
const describeVariant = (variant: ProductVariantListItemDto): string => {
  if (variant.name) return variant.name;
  const attributes = variant.attributes;
  if (!attributes || typeof attributes !== 'object') return '';
  return Object.values(attributes)
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map(String)
    .join(' · ');
};

const imageFor = (variant: ProductVariantListItemDto): string | undefined => variant.images?.[0] ?? variant.product?.images?.[0];

/* ------------------------------ sub-components ---------------------------- */

function SectionHeading({ title, href, cta = 'View all' }: { title: string; href?: string; cta?: string }) {
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

function VariantCard({ variant, compact = false }: { variant: ProductVariantListItemDto; compact?: boolean }) {
  const stock = variant.stockQuantity ?? 0;
  const soldOut = stock <= 0;
  const isLowStock = !soldOut && stock <= (variant.lowStockThreshold || 5);
  // A price staged for a future date leaves the SKU with no price in force today.
  const unpriced = variant.sellingPrice === null || variant.sellingPrice === undefined;
  const description = describeVariant(variant);
  const image = imageFor(variant);

  // Only a real compare-at price earns a discount badge. The figure is stored per price row,
  // so when it is absent there is genuinely nothing to strike through - and inventing one
  // would be a fake discount on a live storefront.
  const wasPrice = variant.compareAtPrice ?? null;
  const discount =
    !unpriced && wasPrice && wasPrice > (variant.sellingPrice as number)
      ? Math.round(((wasPrice - (variant.sellingPrice as number)) / wasPrice) * 100)
      : null;

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-xl border-border bg-card p-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <div className={`relative overflow-hidden bg-muted/30 ${compact ? 'aspect-[4/3]' : 'aspect-square'}`}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${variant.product?.name ?? 'Product'}${description ? ` - ${description}` : ''}`}
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-9 w-9 text-muted-foreground/30" />
          </div>
        )}

        {discount !== null && (
          <span className="absolute left-2.5 top-2.5 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">-{discount}%</span>
        )}
        {soldOut ? (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-foreground/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">
            Sold out
          </span>
        ) : isLowStock ? (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {stock} left
          </span>
        ) : null}
        {soldOut && <div className="pointer-events-none absolute inset-0 bg-background/45" />}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-3">
        {variant.product?.category?.name && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{variant.product.category.name}</span>
        )}
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {variant.product?.name ?? variant.sku}
        </h3>
        {/* What distinguishes this SKU from its siblings - the reason it is its own card. */}
        <p className="line-clamp-1 min-h-[1rem] text-[11px] text-muted-foreground">{description}</p>

        <div className="mt-2 flex items-baseline gap-2">
          {unpriced ? (
            <span className="text-sm font-semibold text-muted-foreground">Coming soon</span>
          ) : (
            <>
              <span className="text-base font-bold tracking-tight text-foreground">{formatPrice(variant.sellingPrice as number)}</span>
              {wasPrice && discount !== null && <span className="text-xs text-muted-foreground line-through">{formatPrice(wasPrice)}</span>}
            </>
          )}
        </div>

        <div className="mt-3">
          {soldOut || unpriced ? (
            <Button size="sm" className="h-9 w-full rounded-lg text-xs font-semibold" disabled>
              {soldOut ? 'Sold out' : 'Not yet on sale'}
            </Button>
          ) : (
            <Link href="/login" className="block">
              <Button size="sm" className="h-9 w-full rounded-lg text-xs font-semibold">
                <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                Order now
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

function CardSkeletons({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden rounded-xl border-border p-0">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-5 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ----------------------------------- page --------------------------------- */

export default function EKarobarHome() {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch] = useDebounce(searchText, 600);
  const [sortKey, setSortKey] = useState('newest');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [trendingTab, setTrendingTab] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const [variants, setVariants] = useState<ProductVariantListItemDto[]>([]);
  const [recordCount, setRecordCount] = useState(0);

  // The storefront lists sellable SKUs, not products: a 64GB and a 128GB phone are different
  // things to buy, at different prices. Paging happens over variants so the counts are real.
  const filterParams: ProductVariantFilterParams = useMemo(() => {
    const sort = SORT_OPTIONS.find((option) => option.value === sortKey) ?? SORT_OPTIONS[0]!;
    return {
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      page,
      recordPerPage: config.recordPerPage,
      sortBy: sort.sortBy,
      sortDirection: sort.sortOrder,
    };
  }, [debouncedSearch, page, sortKey]);

  const { data: response, isLoading, isError, isSuccess } = useGetAllPublicProductVariants(filterParams);

  useEffect(() => {
    if (isSuccess && response?.data?.data) {
      setVariants(response.data.data.data ?? []);
      setRecordCount(response.data.data.totalRecord ?? 0);
    }
  }, [isSuccess, response]);

  // A new search or sort invalidates whatever page the shopper was on.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortKey]);

  // Category chips come from what is on the page - the categories endpoint needs a login,
  // and a shopper browsing anonymously has no token to send.
  // Name plus whatever art the category carries, de-duplicated by name.
  const categories = useMemo(() => {
    const seen = new Map<string, string | undefined>();
    for (const variant of variants) {
      const name = variant.product?.category?.name;
      if (!name) continue;
      if (!seen.has(name)) seen.set(name, variant.product?.category?.images?.[0]);
    }
    return Array.from(seen, ([name, image]) => ({ name, image })).sort((a, b) => a.name.localeCompare(b.name));
  }, [variants]);

  const visible = category ? variants.filter((variant) => variant.product?.category?.name === category) : variants;

  // The curated rows are slices of the same page rather than separate endpoints: the data has
  // no "popular" or "featured" signal yet, so ranking one would be invented.
  const popular = variants.slice(0, 5);
  const latest = variants.slice(0, 5);
  const newArrivals = variants.slice(0, 4);
  const trending = trendingTab ? variants.filter((variant) => variant.product?.category?.name === trendingTab) : variants;

  const pageSize = config.recordPerPage;
  const pageCount = Math.max(1, Math.ceil((recordCount || 0) / pageSize));
  const firstOnPage = recordCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastOnPage = Math.min(firstOnPage + variants.length - 1, recordCount);

  return (
    <div id="top" className="min-h-screen bg-background text-foreground antialiased">
      {/* ------------------------------- Utility bar ----------------------------- */}
      <div className="hidden border-b border-border bg-muted/40 py-1.5 text-xs text-muted-foreground md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span>Free shipping on every prepaid order</span>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              Call for order: +91 0123 456 789
            </span>
            <Link href="/login" className="font-medium hover:text-foreground">
              Log in / Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* --------------------------------- Header -------------------------------- */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Store className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">eKarobar</span>
          </Link>

          <div className="relative mx-auto hidden w-full max-w-xl md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products, SKUs or brands..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="h-11 rounded-full border-border bg-muted/40 pl-10"
            />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Link href="/login" aria-label="Wishlist">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" aria-label="Cart">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ShoppingBag className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" className="hidden sm:block">
              <Button className="ml-1 rounded-full font-semibold">Get started</Button>
            </Link>

            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <nav className="mt-8 flex flex-col gap-1">
                    {NAV_LINKS.map((link) => (
                      <a key={link.label} href={link.href} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                        {link.label}
                      </a>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <div className="hidden border-t border-border md:block">
          <div className="mx-auto flex h-11 max-w-7xl items-center gap-6 px-4 text-sm sm:px-6 lg:px-8">
            <span className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 font-semibold text-primary">
              <LayoutGrid className="h-4 w-4" />
              Shop by category
            </span>
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="font-medium text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ---------------------------------- Hero --------------------------------- */}
      <section className="bg-gradient-to-r from-orange-500 via-orange-500 to-rose-500 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div className="space-y-5">
            <span className="inline-block rounded bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
              Flat 20% discount
            </span>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Everything you need,
              <br />
              in stock and ready to ship
            </h1>
            <p className="max-w-md text-white/85">Browse the full catalogue with live prices and real stock counts on every SKU.</p>
            <a href="#all-products" className="inline-block">
              <Button size="lg" className="h-12 rounded-full bg-white px-8 font-bold text-orange-600 hover:bg-white/90">
                Shop now
              </Button>
            </a>
          </div>
          <div className="hidden justify-center lg:flex">
            {/* The hero image is the newest SKU's own photo, so the banner is never stale. */}
            {popular[0] && imageFor(popular[0]) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageFor(popular[0])} alt={popular[0].product?.name ?? ''} className="max-h-72 w-auto object-contain drop-shadow-2xl" />
            ) : (
              <ShoppingBag className="h-40 w-40 text-white/30" />
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------- Trust strip ----------------------------- */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 sm:px-6 lg:grid-cols-4 lg:px-8">
          {TRUST_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold sm:text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------- Promo tiles ----------------------------- */}
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

      {/* ----------------------------- Shop by category -------------------------- */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <SectionHeading title="Shop by category" href="#all-products" cta="Browse all" />
          <div className="flex flex-wrap gap-4">
            {categories.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  setCategory(item.name);
                  document.getElementById('all-products')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group flex w-28 flex-col items-center gap-2"
              >
                <span
                  className={`flex h-24 w-28 items-center justify-center overflow-hidden rounded-xl transition-transform group-hover:-translate-y-1 ${
                    item.image ? 'bg-muted/40' : CATEGORY_TONES[index % CATEGORY_TONES.length]
                  }`}
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-8 w-8 text-slate-700/60" />
                  )}
                </span>
                <span className="line-clamp-1 text-xs font-semibold">{item.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ----------------------------- Popular products -------------------------- */}
      <section id="popular" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <SectionHeading title="Popular products" href="#all-products" />
        {isLoading ? (
          <CardSkeletons />
        ) : popular.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">Nothing published yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {popular.map((variant) => (
              <VariantCard key={`popular-${variant.id}`} variant={variant} />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------- Banner pair ----------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-muted/50 p-6">
            <div>
              <h3 className="max-w-[16rem] text-lg font-bold leading-tight">Fresh stock lands every week</h3>
              <p className="mt-1 max-w-[18rem] text-sm text-muted-foreground">New SKUs are published the moment they are priced.</p>
              <a href="#new-arrivals" className="mt-4 inline-block">
                <Button className="rounded-full font-semibold">Shop now</Button>
              </a>
            </div>
            <Truck className="hidden h-24 w-24 shrink-0 text-muted-foreground/25 sm:block" />
          </div>
          <div className="flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-primary/10 p-6">
            <div>
              <h3 className="max-w-[16rem] text-lg font-bold leading-tight">Every price, fully traceable</h3>
              <p className="mt-1 max-w-[18rem] text-sm text-muted-foreground">You see the price in force right now, not a stale cache.</p>
              <a href="#all-products" className="mt-4 inline-block">
                <Button variant="outline" className="rounded-full bg-background font-semibold">
                  Browse catalogue
                </Button>
              </a>
            </div>
            <ShieldCheck className="hidden h-24 w-24 shrink-0 text-primary/25 sm:block" />
          </div>
        </div>
      </section>

      {/* ------------------------------ Latest products -------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <SectionHeading title="Latest products" href="#all-products" />
        {isLoading ? (
          <CardSkeletons />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {latest.map((variant) => (
              <VariantCard key={`latest-${variant.id}`} variant={variant} />
            ))}
          </div>
        )}
      </section>

      {/* --------------------------------- Trending ------------------------------ */}
      {categories.length > 0 && (
        <section className="bg-muted/40 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <h2 className="mr-2 text-xl font-bold tracking-tight sm:text-2xl">Trending products</h2>
              <button
                type="button"
                onClick={() => setTrendingTab(undefined)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  trendingTab === undefined ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              {categories.map(({ name }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setTrendingTab(name)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    trendingTab === name ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {trending.slice(0, 8).map((variant) => (
                <VariantCard key={`trending-${variant.id}`} variant={variant} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------- New arrivals ---------------------------- */}
      <section id="new-arrivals" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
          <div className="flex flex-col justify-center rounded-2xl bg-rose-600 p-6 text-white">
            <h2 className="text-2xl font-extrabold leading-tight">New arrival</h2>
            <p className="mt-2 text-sm text-white/85">The most recently added SKUs in the store, newest first.</p>
            <a href="#all-products" className="mt-5 inline-flex items-center gap-1 text-sm font-bold underline-offset-4 hover:underline">
              See everything
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {newArrivals.map((variant) => (
              <VariantCard key={`new-${variant.id}`} variant={variant} />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- All products ---------------------------- */}
      <section id="all-products" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <ShoppingBag className="h-3.5 w-3.5" />
              Our catalogue
            </span>
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">All products</h2>
              {!isLoading && !isError && (
                <span className="text-sm font-medium text-muted-foreground">
                  {recordCount} {recordCount === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                className="h-11 rounded-xl bg-background pl-10"
              />
            </div>
            <select
              aria-label="Sort products"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value)}
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {categories.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory(undefined)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                category === undefined ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground'
              }`}
            >
              All
            </button>
            {categories.map(({ name }) => (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  category === name ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <CardSkeletons count={10} />
        ) : isError ? (
          <div className="rounded-2xl border border-dashed border-border py-20 text-center">
            <p className="text-sm font-semibold">Couldn&apos;t load products</p>
            <p className="mt-1 text-xs text-muted-foreground">Something went wrong. Please try again in a moment.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-20 text-center">
            <p className="text-sm font-semibold">No products found</p>
            <p className="mt-1 text-xs text-muted-foreground">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((variant) => (
              <VariantCard key={variant.id} variant={variant} />
            ))}
          </div>
        )}

        {!isLoading && !isError && recordCount > 0 && !category && (
          <div className="mt-10 flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{firstOnPage}</span>–
              <span className="font-semibold text-foreground">{lastOnPage}</span> of{' '}
              <span className="font-semibold text-foreground">{recordCount}</span> products
            </p>
            {pageCount > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-10 rounded-xl px-4" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                  Previous
                </Button>
                <span className="px-2 text-sm text-muted-foreground">
                  Page {page} of {pageCount}
                </span>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl px-4"
                  disabled={page >= pageCount}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ------------------------------- Testimonials ---------------------------- */}
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

      {/* -------------------------------- Wide promo ----------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-slate-900 p-8 text-white sm:flex-row sm:p-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Discount up to 40% off</span>
            <h3 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">Flagship phones, everyday prices</h3>
            <p className="mt-2 max-w-md text-sm text-white/70">Live stock, transparent pricing and a full history behind every change.</p>
          </div>
          <a href="#all-products">
            <Button size="lg" className="h-12 rounded-full bg-amber-400 px-8 font-bold text-slate-900 hover:bg-amber-300">
              Shop the deals
            </Button>
          </a>
        </div>
      </section>

      {/* ----------------------------------- Blog -------------------------------- */}
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

      {/* ---------------------------------- Brands ------------------------------- */}
      <section className="border-y border-border bg-card py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-6 px-4 sm:px-6 lg:px-8">
          {BRANDS.map((brand) => (
            <span key={brand} className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
              {brand}
            </span>
          ))}
        </div>
      </section>

      {/* -------------------------------- Newsletter ----------------------------- */}
      <section className="bg-amber-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
          <div className="flex items-center gap-3 text-amber-950">
            <Mail className="h-8 w-8" />
            <p className="text-lg font-extrabold">Join our newsletter for ₹100 off</p>
          </div>
          <form className="flex w-full max-w-md gap-2" onSubmit={(event) => event.preventDefault()}>
            <Input type="email" required placeholder="Email address" className="h-11 rounded-full border-0 bg-white text-slate-900" />
            <Button type="submit" className="h-11 shrink-0 rounded-full bg-slate-900 px-6 font-bold text-white hover:bg-slate-800">
              Subscribe
            </Button>
          </form>
        </div>
      </section>

      {/* ---------------------------------- Footer ------------------------------- */}
      <footer id="footer" className="bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Store className="h-5 w-5" />
                </span>
                <span className="text-lg font-bold text-white">eKarobar</span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-slate-400">
                A modern storefront to browse products, check live stock and prices, and order with ease.
              </p>
              <div className="space-y-2 text-sm text-slate-400">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  Mega Store, Centre France
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  +91 0123 456 789
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  demo@example.com
                </p>
              </div>
            </div>

            {[
              { title: 'Your account', links: ['Search', 'About us', 'Delivery information', 'Contact', 'FAQs'] },
              { title: 'Information', links: ['Size chart', 'Shipping', 'Legal notice', 'Delivery', 'Sitemap'] },
              { title: 'Quick links', links: ['Privacy policy', 'Refund policy', 'Shipping policy', 'Terms of service'] },
            ].map((column) => (
              <div key={column.title} className="space-y-3">
                <h4 className="text-sm font-semibold text-white">{column.title}</h4>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a href="#top" className="text-sm text-slate-400 transition-colors hover:text-white">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-sm text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} eKarobar. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Headphones className="h-4 w-4" />
              <span className="text-xs">Support available 24/7</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
