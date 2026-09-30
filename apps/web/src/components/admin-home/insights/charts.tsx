'use client';
import { cn } from '@/lib/utils';

// Hand-drawn SVG charts. The project has no chart library and these two shapes are all the
// dashboard needs; adding recharts for them would cost more bundle than the whole page.

export const CHART_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#db2777', '#7c3aed', '#0891b2', '#dc2626', '#65a30d'];

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  /** Text in the middle, e.g. the total. */
  centerLabel?: string;
  centerSub?: string;
  size?: number;
  thickness?: number;
  className?: string;
}

export function DonutChart({ slices, centerLabel, centerSub, size = 160, thickness = 18, className }: DonutChartProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel ? `${centerLabel} ${centerSub ?? ''}` : 'Distribution'}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={thickness} />
        {total > 0 &&
          slices.map((slice) => {
            const length = (slice.value / total) * circumference;
            const dash = `${length} ${circumference - length}`;
            const el = (
              <circle
                key={slice.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="transition-[stroke-dasharray] duration-500"
              >
                <title>
                  {slice.label}: {slice.value}
                </title>
              </circle>
            );
            offset += length;
            return el;
          })}
      </svg>
      {(centerLabel || centerSub) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerLabel && <span className="text-2xl font-bold tabular-nums leading-none">{centerLabel}</span>}
          {centerSub && <span className="mt-1 text-[11px] text-muted-foreground">{centerSub}</span>}
        </div>
      )}
    </div>
  );
}

export interface ComparisonRow {
  label: string;
  a: number;
  b: number;
}

interface ComparisonBarsProps {
  rows: ComparisonRow[];
  aLabel: string;
  bLabel: string;
  aColor?: string;
  bColor?: string;
  format?: (value: number) => string;
}

// Two horizontal bars per row, both scaled to the largest value on the chart so rows compare.
export function ComparisonBars({ rows, aLabel, bLabel, aColor = CHART_COLORS[0], bColor = CHART_COLORS[2], format = String }: ComparisonBarsProps) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.a, r.b]));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: aColor }} />
          {aLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: bColor }} />
          {bLabel}
        </span>
      </div>
      {rows.map((row) => (
        <div key={row.label} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{row.label}</span>
          </div>
          {[
            { value: row.a, color: aColor, label: aLabel },
            { value: row.b, color: bColor, label: bLabel },
          ].map((bar) => (
            <div key={bar.label} className="flex items-center gap-2">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.max(bar.value > 0 ? 2 : 0, (bar.value / max) * 100)}%`, background: bar.color }}
                  title={`${bar.label}: ${format(bar.value)}`}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{format(bar.value)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
