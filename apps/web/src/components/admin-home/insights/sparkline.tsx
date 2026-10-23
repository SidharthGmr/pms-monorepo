'use client';
import { cn } from '@/lib/utils';
import { useId, useState } from 'react';

/**
 * A single-series mini chart: smoothed area, a dotted baseline, and a readout that always shows
 * a date and its value - the latest day at rest, the hovered day while exploring - so the figure
 * is never left to be guessed from the shape. One series means no legend; the tile's own
 * heading names it.
 */

export interface SparkPoint {
  label: string;
  value: number;
}

interface SparklineProps {
  points: SparkPoint[];
  /** Any CSS colour; defaults to the theme's primary so every palette restyles it. */
  color?: string;
  height?: number;
  /** Renders the readout value, e.g. as currency. */
  format?: (value: number) => string;
  className?: string;
  onDark?: boolean;
  /** The date-and-value line above the plot. On by default; the hero turns it off to stay compact. */
  readout?: boolean;
}

const WIDTH = 100;
const PAD = 4;

/** Catmull-Rom through the points, as cubic beziers - the gentle curve is what reads "trend"
 *  rather than "connect the dots". Control points are clamped to the padded plot so the curve
 *  can never overshoot the viewBox. Shared with the day-by-day chart. */
export const smoothPath = (coords: { x: number; y: number }[], pad = PAD): string => {
  if (coords.length < 3) return coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');
  let d = `M${coords[0].x.toFixed(2)},${coords[0].y.toFixed(2)}`;
  for (let i = 0; i < coords.length - 1; i += 1) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = Math.min(100 - pad, Math.max(pad, p1.y + (p2.y - p0.y) / 6));
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = Math.min(100 - pad, Math.max(pad, p2.y - (p3.y - p1.y) / 6));
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
};

export default function Sparkline({ points, color = 'hsl(var(--primary))', height = 48, format = String, className, onDark = false, readout = true }: SparklineProps) {
  const gradientId = useId();
  const [active, setActive] = useState<number | null>(null);

  if (points.length < 2) return <div className={cn('text-[11px] text-muted-foreground', className)}>Not enough history yet</div>;

  const values = points.map((point) => point.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min;
  // An unvarying series has no shape to show; drawing it down the middle says "flat", where
  // normalising against a fallback span would pin it to the floor and imply zero.
  const normalise = (value: number) => (span === 0 ? 0.5 : (value - min) / span);
  const plot = 100 - PAD * 2;

  const coords = points.map((point, index) => ({
    x: (index / (points.length - 1)) * WIDTH,
    y: PAD + (1 - normalise(point.value)) * plot,
  }));

  const line = smoothPath(coords);
  const area = `${line} L${WIDTH},100 L0,100 Z`;
  const shown = active ?? points.length - 1;

  const mutedText = onDark ? 'text-primary-foreground/60' : 'text-muted-foreground';
  const strongText = onDark ? 'text-primary-foreground' : 'text-foreground';

  const track = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
    setActive(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
  };

  return (
    <div className={cn('min-w-0', className)}>
      {readout && (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className={cn('inline-flex items-center gap-1.5 text-[11px] tabular-nums', mutedText)}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
            {points[shown].label}
            {active === null && <span className="opacity-70">· latest</span>}
          </span>
          <span className={cn('text-xs font-bold tabular-nums', strongText)}>{format(points[shown].value)}</span>
        </div>
      )}

      <div
        className="relative"
        style={{ height }}
        onMouseMove={track}
        onMouseLeave={() => setActive(null)}
        role="img"
        aria-label={`${points.length} day trend, from ${format(values[0])} on ${points[0].label} to ${format(values[values.length - 1])} on ${points[points.length - 1].label}`}
      >
        <svg width="100%" height={height} viewBox={`0 0 ${WIDTH} 100`} preserveAspectRatio="none" className="overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={onDark ? 0.5 : 0.28} />
              <stop offset="70%" stopColor={color} stopOpacity={onDark ? 0.12 : 0.06} />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="100" x2={WIDTH} y2="100" stroke={color} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          <path d={area} fill={`url(#${gradientId})`} />
          <path d={line} fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {active !== null && (
            <line x1={coords[active].x} y1={PAD} x2={coords[active].x} y2="100" stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.55" vectorEffect="non-scaling-stroke" />
          )}
          <circle cx={coords[shown].x} cy={coords[shown].y} r="4" fill={color} stroke={onDark ? 'rgba(255,255,255,0.9)' : 'hsl(var(--card))'} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {active === null && <circle cx={coords[shown].x} cy={coords[shown].y} r="4" fill={color} opacity="0.3" className="animate-ping" vectorEffect="non-scaling-stroke" />}
        </svg>
      </div>

      <div className={cn('mt-1 flex items-center justify-between text-[9px] tabular-nums', mutedText)}>
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}
