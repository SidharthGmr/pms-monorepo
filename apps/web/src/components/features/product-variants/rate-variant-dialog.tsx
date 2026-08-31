'use client';
import StarRating from '@/components/common/star-rating';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useRateProductVariant } from '@/hooks/service-hooks/useProductVariantService';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
};

interface RateVariantDialogProps {
  variantId: number;
  /** Shown under the title so the rater knows what they are scoring. */
  variantName?: string | null;
  sku?: string | null;
  /** The variant's current average, for context while choosing. */
  rating?: number | null;
  ratingCount?: number | null;
  /** This user's existing score, when known - the dialog opens pre-filled so they can change it. */
  initialRating?: number | null;
  isOpen: boolean;
  /** `refresh` is true when a rating was actually saved. */
  onClose: (refresh: boolean) => void;
}

/**
 * Deliberate rate-this-variant flow: pick stars, confirm, submit.
 *
 * The inline `VariantRating` posts the moment a star is clicked, which suits a dense admin
 * row but is a trap on a storefront - a mis-click is an unretractable vote. Here the choice
 * is only committed on Submit, and the picked score is spelled out in words first.
 */
export default function RateVariantDialog({
  variantId,
  variantName,
  sku,
  rating,
  ratingCount,
  initialRating,
  isOpen,
  onClose,
}: RateVariantDialogProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const rateVariant = useRateProductVariant();

  const [value, setValue] = useState<number>(initialRating ?? 0);
  const [error, setError] = useState<string | null>(null);

  // Reopening for a different variant must not carry the last one's score over.
  useEffect(() => {
    if (isOpen) {
      setValue(initialRating ?? 0);
      setError(null);
    }
  }, [isOpen, variantId, initialRating]);

  const submitData = async () => {
    if (value < 1) {
      setError('Pick a star rating first.');
      return;
    }

    try {
      const response = await rateVariant.mutateAsync({ id: variantId, model: { rating: value } });

      if (response && response.status === 200) {
        const summary = response.data?.data;
        toast({
          variant: 'success',
          title: initialRating ? 'Rating updated' : 'Thanks for rating!',
          description: <span>Now {summary?.rating?.toFixed(1) ?? value} out of 5 from {summary?.ratingCount ?? 1} rating(s).</span>,
        });
        onClose(true);
        return;
      }

      const message = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Could not save rating', description: <span>{message}</span> });
    } catch (err: any) {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(err);
      toast({ variant: 'destructive', title: 'Could not save rating', description: <span>{message || 'Unknown error occurred'}</span> });
    }
  };

  const subtitle = [variantName, sku].filter(Boolean).join(' · ');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialRating ? 'Change your rating' : 'Rate this variant'}</DialogTitle>
          {subtitle && <DialogDescription className="truncate">{subtitle}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2 rounded-xl border bg-muted/30 py-6">
            <StarRating
              value={value}
              size="lg"
              onChange={(next) => {
                setValue(next);
                setError(null);
              }}
            />
            <span className="text-sm font-medium">{value ? RATING_LABELS[value] : 'Tap a star to choose'}</span>
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          {rating != null && (
            <p className="text-center text-xs text-muted-foreground">
              Currently {rating.toFixed(1)} out of 5 from {ratingCount ?? 0} rating{ratingCount === 1 ? '' : 's'}
            </p>
          )}

          <p className="text-center text-xs text-muted-foreground">
            You can rate a variant once — rating again replaces your previous score.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={rateVariant.isPending}>
              Cancel
            </Button>
            <Button type="button" onClick={submitData} loading={rateVariant.isPending} icon={Star} iconPlacement="left">
              {initialRating ? 'Update Rating' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
