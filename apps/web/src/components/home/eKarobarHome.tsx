'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import config from '@/config';
import { ProductVariantListItemDto } from '@/dtos/product-variant.dto';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { ProductVariantFilterParams } from '@/params/product-variant.params';
import {
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Headphones,
  Heart,
  LayoutGrid,
  Mail,
  MapPin,
  Menu,
  Phone,
  RotateCcw,
  Search,
  ShoppingBag,
  Store,
  Tag,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import PublicVariantList from '../features/public-variants';

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
  {
    quote: 'Reliable product, consistently delivers. Ordering was simple and it arrived ahead of the estimate.',
    name: 'Stefanie Rashford',
    role: 'Founder',
  },
  { quote: 'Excellent product, A+ customer service. The team answered every question before I bought.', name: 'Augusta Wind', role: 'Web Designer' },
  { quote: 'Impressive quality, durable and reliable. Exactly what was described on the listing.', name: 'Reema Ghurde', role: 'Manager' },
];

const BLOG_POSTS = [
  {
    date: 'July 3, 2026',
    title: 'The most innovative things happening with online retail',
    excerpt: 'How storefronts are changing as inventory, pricing and fulfilment move closer together.',
  },
  {
    date: 'July 3, 2026',
    title: 'Seven answers to the most frequently asked questions',
    excerpt: 'The questions shoppers ask most often before placing a first order, answered plainly.',
  },
  {
    date: 'July 3, 2026',
    title: 'Meet the people behind the products you buy',
    excerpt: 'A look at the suppliers and makers who keep the shelves stocked week after week.',
  },
];

const BRANDS = ['EVM', 'HUAWEI', 'CONNECT', 'HACKETT', 'RIYAN', 'VERCELLI'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first', sortBy: 'createdAt', sortOrder: 'desc' as const },
  { value: 'sku-asc', label: 'SKU: A to Z', sortBy: 'sku', sortOrder: 'asc' as const },
  { value: 'sku-desc', label: 'SKU: Z to A', sortBy: 'sku', sortOrder: 'desc' as const },
];



/* --------------------------------- helpers -------------------------------- */

/* --------------------------------- helpers -------------------------------- */

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

/* ----------------------------------- page --------------------------------- */

export default function EKarobarHome() {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch] = useDebounce(searchText, 600);
  const [sortKey] = useState('newest');
  const [page, setPage] = useState(1);

  const [variants, setVariants] = useState<ProductVariantListItemDto[]>([]);

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

  const { data: response, isSuccess } = useGetAllPublicProductVariants(filterParams);

  useEffect(() => {
    if (isSuccess && response?.data?.data) {
      setVariants(response.data.data.data ?? []);
    }
  }, [isSuccess, response]);

  // A new search or sort invalidates whatever page the shopper was on.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortKey]);

  // The curated rows are slices of the same page rather than separate endpoints: the data has
  // no "popular" or "featured" signal yet, so ranking one would be invented.
  const popular = variants.slice(0, 5);


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
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="">
          <PublicVariantList />
        </div>
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
