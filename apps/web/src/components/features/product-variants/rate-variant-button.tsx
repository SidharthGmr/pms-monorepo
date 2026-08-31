'use client';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useState } from 'react';
import RateVariantDialog from './rate-variant-dialog';

interface RateVariantButtonProps {
  variantId: number;
  variantName?: string | null;
  sku?: string | null;
  rating?: number | null;
  ratingCount?: number | null;
  /** This user's existing score, when the caller knows it. */
  initialRating?: number | null;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
  /** Fires after a rating is saved, for callers that need to refetch something extra. */
  onRated?: () => void;
}

/**
 * Drop-in "Rate" trigger: owns the dialog's open state so a card or table row only has to
 * render one element. Use this wherever a user should *choose* to rate; use `VariantRating`
 * with `interactive` where clicking a star directly is the intended, low-stakes gesture.
 */
export default function RateVariantButton({
  variantId,
  variantName,
  sku,
  rating,
  ratingCount,
  initialRating,
  label,
  variant = 'outline',
  size = 'sm',
  className,
  onRated,
}: RateVariantButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} icon={Star} iconPlacement="left" onClick={() => setIsOpen(true)}>
        {label ?? (initialRating ? 'Change rating' : 'Rate')}
      </Button>

      {/* Mounted only while open so each run starts from a clean picker. */}
      {isOpen && (
        <RateVariantDialog
          variantId={variantId}
          variantName={variantName}
          sku={sku}
          rating={rating}
          ratingCount={ratingCount}
          initialRating={initialRating}
          isOpen={isOpen}
          onClose={(refresh) => {
            setIsOpen(false);
            if (refresh) onRated?.();
          }}
        />
      )}
    </>
  );
}
