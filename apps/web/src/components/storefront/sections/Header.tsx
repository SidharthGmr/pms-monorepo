'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Heart, LayoutGrid, Menu, Search, ShoppingBag, Store } from 'lucide-react';
import Link from 'next/link';
import { BRAND, NAV_LINKS } from '../theme.config';

type HeaderProps = {
  searchText: string;
  onSearchChange: (value: string) => void;
};

export default function Header({ searchText, onSearchChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Store className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">{BRAND.name}</span>
        </Link>

        <div className="relative mx-auto hidden w-full max-w-xl md:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products, SKUs or brands..."
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-11 rounded-full border-border bg-muted/40 pl-10"
            aria-label="Search products"
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
                <Button variant="ghost" size="icon" aria-label="Open menu">
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
        <nav className="mx-auto flex h-11 max-w-7xl items-center gap-6 px-4 text-sm sm:px-6 lg:px-8">
          <span className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 font-semibold text-primary">
            <LayoutGrid className="h-4 w-4" />
            Shop by category
          </span>
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="font-medium text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
