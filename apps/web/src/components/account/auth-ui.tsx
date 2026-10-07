'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

// The shared look of every account card: field rows, headings, dividers and the secondary link button.
// Login, sign-up and the password flows compose these so one change restyles them all.
export const AUTH_FIELD = 'flex h-11 items-center gap-2.5 rounded-xl border bg-background px-3 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20';
export const AUTH_CONTROL = 'h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed';
export const AUTH_FIELD_INVALID = 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20';
export const AUTH_LABEL = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';

export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border bg-card/95 p-6 shadow-[0_24px_60px_-28px_hsl(var(--primary)/0.45)] backdrop-blur sm:p-8', className)}>{children}</div>;
}

export function AuthCardHeader({ eyebrow, title, description, icon: Icon }: { eyebrow: string; title: string; description: string; icon: LucideIcon }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function AuthAltAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex h-11 w-full items-center justify-center rounded-xl border bg-background text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
    >
      {children}
    </Link>
  );
}

export function AuthFootnote({ children }: { children: ReactNode }) {
  return <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">{children}</p>;
}
