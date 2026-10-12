'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BRAND, NAV_LINKS } from '@/data/theme.config';
import { dashboardPathFor } from '@/hooks/use-role-base-redirection';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { Heart, LayoutDashboard, LayoutGrid, LogIn, Menu, Search, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import HeaderTopBar from './HeaderTopBar';

// Search hands the shopper to /products, where the full filterable list lives - the homepage
// itself only shows curated strips, so there is nothing here for a query to filter.
export default function Header() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const { currentUser, status, isAuthenticated } = useGetCurrentUser();
  const dashboardHref = dashboardPathFor(currentUser?.role ? [currentUser.role] : []);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = searchText.trim();
    router.push(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
        <HeaderTopBar />
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* The header sits on `background`, which inverts with the theme, so the dark cut of the
            logo is swapped in there - the navy wordmark would be unreadable otherwise. The mark
            alone carries the brand on phones, where the lockup would eat the search bar. */}
          <Link href="/" className="flex shrink-0 items-center" title={BRAND.name}>
            <Image
              src="/logo-full.png"
              alt={BRAND.name}
              width={960}
              height={223}
              priority
              className="hidden h-9 w-auto object-contain sm:block dark:sm:hidden"
            />
            <Image
              src="/logo-full-light.png"
              alt={BRAND.name}
              width={960}
              height={223}
              priority
              className="hidden h-9 w-auto object-contain dark:sm:block"
            />
            <Image src="/logo.png" alt={BRAND.name} width={512} height={512} priority className="h-9 w-9 object-contain sm:hidden dark:hidden" />
            <Image
              src="/logo-light.png"
              alt={BRAND.name}
              width={512}
              height={512}
              priority
              className="hidden h-9 w-9 object-contain dark:block dark:sm:hidden"
            />
          </Link>

          <form onSubmit={submitSearch} className="relative mx-auto hidden w-full max-w-xl md:block" role="search">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products, SKUs or brands…"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="h-11 rounded-full border-border bg-muted/40 pl-10 pr-24"
              aria-label="Search products"
            />
            <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-full px-4 text-xs font-semibold">
              Search
            </Button>
          </form>

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
            {status === 'loading' ? (
              <span aria-hidden className="ml-1 hidden h-10 w-32 animate-pulse rounded-full bg-muted sm:block" />
            ) : (
              <Link href={isAuthenticated ? dashboardHref : '/login'} className="hidden sm:block">
                <Button className="ml-1 gap-1.5 rounded-full font-semibold">
                  {isAuthenticated && <LayoutDashboard className="h-4 w-4" />}
                  {isAuthenticated ? 'Dashboard' : 'Get started'}
                </Button>
              </Link>
            )}

            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <form onSubmit={submitSearch} className="relative mt-8" role="search">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search products…"
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      className="h-10 rounded-full pl-9"
                      aria-label="Search products"
                    />
                  </form>
                  <nav className="mt-4 flex flex-col gap-1">
                    {NAV_LINKS.map((link) =>
                      link.href.startsWith('/') ? (
                        <Link key={link.label} href={link.href} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                          {link.label}
                        </Link>
                      ) : (
                        <a key={link.label} href={link.href} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                          {link.label}
                        </a>
                      )
                    )}
                  </nav>

                  <div className="mt-4 border-t border-border pt-4">
                    {status === 'loading' ? (
                      <span aria-hidden className="block h-10 w-full animate-pulse rounded-lg bg-muted" />
                    ) : (
                      <Link
                        href={isAuthenticated ? dashboardHref : '/login'}
                        className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15"
                      >
                        {isAuthenticated ? <LayoutDashboard className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                        {isAuthenticated ? 'Dashboard' : 'Log in / Sign up'}
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <div className="hidden border-t border-border md:block">
          <nav className="mx-auto flex h-11 max-w-7xl items-center gap-6 px-4 text-sm sm:px-6 lg:px-8">
            <a
              href="#categories"
              className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              <LayoutGrid className="h-4 w-4" />
              Shop by category
            </a>
            {NAV_LINKS.map((link) =>
              link.href.startsWith('/') ? (
                <Link key={link.label} href={link.href} className="font-medium text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href} className="font-medium text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </a>
              )
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
