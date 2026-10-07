'use client';

import config from '@/config';
import { cn } from '@/lib/utils';
import { BarChart3, Boxes, ShieldCheck, Store } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import Logo from '../common/Logo';

interface LoginLayoutProps {
  children: ReactNode;
  className?: string;
}

const POINTS = [
  { icon: Store, title: 'Every store, one place', text: 'Switch between stores without switching tools.' },
  { icon: Boxes, title: 'Stock that stays honest', text: 'Purchases and sales move inventory the moment they happen.' },
  { icon: BarChart3, title: 'Numbers you can act on', text: 'Daily sales, low stock and top products on one screen.' },
];

// Split-screen sign-in: a photo panel with the product pitch on the left, the form on the right.
// Below `lg` the photo collapses into a slim brand strip so the form is the first thing on a phone.
export default function LoginLayout({ children, className }: LoginLayoutProps) {
  const year = new Date().getFullYear();

  return (
    <main className={cn('min-h-svh bg-muted/40 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]', className)}>
      <section className="relative isolate hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14" aria-hidden>
        <Image src="/login-banner.webp" alt="" fill priority sizes="55vw" className="-z-20 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-slate-900/30" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/35 to-transparent mix-blend-multiply" />

        <Link href="/" className="inline-flex w-fit items-center rounded-xl bg-white/95 px-3 py-2 shadow-sm">
          <Logo className="h-auto w-[130px]" />
        </Link>

        <div className="max-w-lg text-white">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" />
            Product &amp; inventory management
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">Run the whole store from one sign-in.</h1>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-sm text-white/75">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/60">
          © {year} {config.appName}. All rights reserved.
        </p>
      </section>

      <section className="flex min-h-svh flex-col lg:min-h-0">
        <div className="relative isolate flex items-center justify-between overflow-hidden px-5 py-4 lg:hidden">
          <Image src="/login-banner.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-slate-950/70" />
          <Link href="/" className="inline-flex items-center rounded-lg bg-white/95 px-2.5 py-1.5">
            <Logo className="h-auto w-[110px]" />
          </Link>
          <span className="text-xs font-medium text-white/85">{config.appName}</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        <p className="px-4 pb-6 text-center text-[11px] text-muted-foreground lg:hidden">
          © {year} {config.appName}. All rights reserved.
        </p>
      </section>
    </main>
  );
}
