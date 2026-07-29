'use client';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { FaStar } from 'react-icons/fa';

interface StarRatingProps {
  /** 0 means "not rated yet" - every star renders empty. */
  value: number;
  /** Omit to render a read-only display. */
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  /** Shows "4.0" next to the stars. */
  showValue?: boolean;
  className?: string;
}

const SIZE_CLASS = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

const STARS = [1, 2, 3, 4, 5];

/**
 * Read-only by default; passing `onChange` makes it an interactive rating input.
 * The interactive form is a real radio group so it is keyboard and screen-reader
 * accessible rather than a row of clickable icons.
 */
export default function StarRating({ value, onChange, size = 'md', showValue = false, className }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const readOnly = !onChange;
  // While hovering, preview that rating instead of the committed one.
  const shown = hovered ?? value;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div
        className="flex items-center gap-0.5"
        role={readOnly ? 'img' : 'radiogroup'}
        aria-label={readOnly ? `Rated ${value} out of 5` : 'Rating'}
        onMouseLeave={() => setHovered(null)}
      >
        {STARS.map((star) => {
          const filled = star <= shown;

          if (readOnly) {
            return <FaStar key={star} className={cn(SIZE_CLASS[size], filled ? 'text-amber-400' : 'text-muted-foreground/25')} />;
          }

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onMouseEnter={() => setHovered(star)}
              onClick={() => onChange(star)}
            >
              <FaStar className={cn(SIZE_CLASS[size], filled ? 'text-amber-400' : 'text-muted-foreground/25')} />
            </button>
          );
        })}
      </div>
      {showValue && <span className="text-sm font-medium tabular-nums">{value ? value.toFixed(1) : '—'}</span>}
    </div>
  );
}
