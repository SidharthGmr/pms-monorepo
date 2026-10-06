'use client';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

// Building blocks shared by the insights dashboard. Every colour has a dark-mode counterpart so the
// page reads the same under the Dark / Red / Green palettes in globals.css.

export const ACCENT = {
  emerald: { icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', bar: '[&>div]:bg-emerald-500', glow: 'from-emerald-500/15' },
  sky: { icon: 'bg-sky-500/10 text-sky-600 dark:text-sky-400', bar: '[&>div]:bg-sky-500', glow: 'from-sky-500/15' },
  amber: { icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', bar: '[&>div]:bg-amber-500', glow: 'from-amber-500/15' },
  violet: { icon: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', bar: '[&>div]:bg-violet-500', glow: 'from-violet-500/15' },
  rose: { icon: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', bar: '[&>div]:bg-rose-500', glow: 'from-rose-500/15' },
  indigo: { icon: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', bar: '[&>div]:bg-indigo-500', glow: 'from-indigo-500/15' },
} as const;

export type Accent = keyof typeof ACCENT;

export const SURFACE = 'rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm';

// Percent change of today against the month's typical day. `null` when there is no baseline.
export function trendPct(today: number, typical: number): number | null {
  if (typical <= 0) return today > 0 ? 100 : null;
  return Math.round(((today - typical) / typical) * 100);
}

interface TrendChipProps {
  delta: number | null | undefined;
  /** Flips the colouring for spend, where a rise is not good news. */
  inverted?: boolean;
  label?: string;
  onDark?: boolean;
}

export function TrendChip({ delta, inverted = false, label, onDark = false }: TrendChipProps) {
  if (delta === undefined) return <Skeleton className={cn('h-5 w-20', onDark && 'bg-white/20')} />;
  if (delta === null) return <span className={cn('text-[11px]', onDark ? 'text-primary-foreground/70' : 'text-muted-foreground')}>No baseline yet</span>;
  const up = delta > 0;
  const flat = delta === 0;
  const good = flat ? null : inverted ? !up : up;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const tone = onDark
    ? 'bg-white/15 text-primary-foreground'
    : good === null
      ? 'bg-muted text-muted-foreground'
      : good
        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        : 'bg-rose-500/10 text-rose-700 dark:text-rose-400';
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums', tone)}>
      <Icon className="h-3 w-3" />
      {up ? '+' : ''}
      {delta}%{label ? <span className={cn('font-normal', onDark ? 'text-primary-foreground/70' : 'text-muted-foreground')}> {label}</span> : null}
    </span>
  );
}

interface KpiTileProps {
  icon: React.ElementType;
  accent: Accent;
  label: string;
  value?: string;
  delta?: number | null;
  deltaInverted?: boolean;
  progress: number;
  progressLabel: string;
  href: string;
  className?: string;
  style?: React.CSSProperties;
}

export function KpiTile({ icon: Icon, accent, label, value, delta, deltaInverted, progress, progressLabel, href, className, style }: KpiTileProps) {
  const a = ACCENT[accent];
  return (
    <Link href={href} className={cn('group block min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring', className)} style={style}>
      <div className={cn(SURFACE, 'relative h-full overflow-hidden p-4 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md')}>
        <div className={cn('pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br to-transparent', a.glow)} aria-hidden />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            {value === undefined ? <Skeleton className="mt-1.5 h-7 w-28" /> : <p className="mt-1 truncate text-xl font-bold tabular-nums leading-tight sm:text-2xl">{value}</p>}
          </div>
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', a.icon)}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        {delta !== undefined && (
          <div className="relative mt-2">
            <TrendChip delta={delta} inverted={deltaInverted} label="vs typical day" />
          </div>
        )}
        <Progress value={progress} className={cn('mt-3 h-1.5', a.bar)} />
        <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{progressLabel}</p>
      </div>
    </Link>
  );
}

interface PanelProps {
  title: string;
  icon: React.ElementType;
  hint?: string;
  count?: number;
  href?: string;
  cta?: string;
  /** Extra control rendered in the header, e.g. a segmented toggle. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  style?: React.CSSProperties;
}

export function Panel({ title, icon: Icon, hint, count, href, cta, action, children, className, bodyClassName, style }: PanelProps) {
  return (
    <section className={cn(SURFACE, 'min-w-0', className)} style={style}>
      <div className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold leading-tight">
              {title}
              {count !== undefined && <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">{count}</span>}
            </h2>
            {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {href && cta && (
            <Link href={href} className="group inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <span className="hidden sm:inline">{cta}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>
      <div className={cn('px-4 py-4 sm:px-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyLine({ icon: Icon, text, tone = 'muted' }: { icon: React.ElementType; text: string; tone?: 'muted' | 'good' }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-lg px-3 py-3 text-xs', tone === 'good' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-muted/50 text-muted-foreground')}>
      <Icon className="h-4 w-4 shrink-0" />
      {text}
    </div>
  );
}

const INITIAL_TONES = [
  'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
];

export function Initials({ name, active }: { name: string; active: boolean }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const tone = INITIAL_TONES[name.length % INITIAL_TONES.length];
  return (
    <span className="relative shrink-0">
      <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold', tone)}>{initials || '?'}</span>
      <span className={cn('absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background', active ? 'bg-emerald-500' : 'bg-zinc-400')} title={active ? 'Active' : 'Inactive'} />
    </span>
  );
}

// Tiny segmented control used inside panel headers.
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div className="inline-flex rounded-md border bg-muted/40 p-0.5 text-[11px]" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('rounded px-2 py-0.5 font-medium transition-colors', value === o.value ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
