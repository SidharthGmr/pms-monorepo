'use client';

import config from '@/config';
import { cn } from '@/lib/utils';
import { ArrowUpRight, BarChart3, Boxes, Store } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';
import Logo from '../common/Logo';

interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

const HIGHLIGHTS = [
  { icon: Store, label: 'Multi-store' },
  { icon: Boxes, label: 'Live stock' },
  { icon: BarChart3, label: 'Daily insights' },
];

// Shared shell for every account page: a tinted mesh glow over a fading grid with the card centred on top.
// Everything is driven by theme tokens, so the page follows whichever palette is active.
export default function AuthLayout({ children, className, contentClassName }: AuthLayoutProps) {
  const year = new Date().getFullYear();

  return (
    <main className={cn('relative isolate flex min-h-svh flex-col overflow-hidden bg-background', className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_-10%,hsl(var(--primary)/0.22),transparent_55%),radial-gradient(ellipse_at_88%_110%,hsl(var(--primary)/0.16),transparent_55%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,hsl(var(--border)/0.9)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.9)_1px,transparent_1px)] [background-size:46px_46px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="absolute left-1/2 top-[-12rem] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <header className="flex items-center justify-between gap-3 px-5 py-5 sm:px-8 sm:py-6">
        <Link href="/" className="inline-flex items-center rounded-xl border bg-card/80 px-3 py-2 shadow-sm backdrop-blur transition-colors hover:bg-card">
          <Logo className="h-auto w-[118px]" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-full border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground"
        >
          Back to store
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
        <div className={cn('w-full max-w-[440px]', contentClassName)}>
          {children}

          <ul className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="flex flex-col items-center gap-2 px-5 pb-6 text-[11px] text-muted-foreground sm:flex-row sm:justify-between sm:px-8">
        <p>
          © {year} {config.appName}. All rights reserved.
        </p>
        <nav className="flex items-center gap-4">
          <Link href="/products" className="transition-colors hover:text-foreground">
            Storefront
          </Link>
          <Link href="/recover-password" className="transition-colors hover:text-foreground">
            Reset password
          </Link>
          <Link href="/sign-up" className="transition-colors hover:text-foreground">
            Create account
          </Link>
        </nav>
      </footer>
    </main>
  );
}
