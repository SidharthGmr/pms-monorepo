const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

export const formatPrice = (amount?: number | null): string => (amount === null || amount === undefined ? '—' : currencyFormatter.format(Number(amount)));

/** Gross margin on a row, or null when there is no cost to compare against. */
export const marginPercent = (sellingPrice?: number | null, costPrice?: number | null): number | null => {
  if (sellingPrice === null || sellingPrice === undefined || !sellingPrice) return null;
  if (costPrice === null || costPrice === undefined) return null;
  return ((sellingPrice - costPrice) / sellingPrice) * 100;
};

/** A price row dated in the future is staged - it is not what the variant sells for yet. */
export const isScheduled = (effectiveFrom?: string | null): boolean => {
  if (!effectiveFrom) return false;
  return new Date(effectiveFrom).getTime() > Date.now();
};

export const formatPercent = (value?: number | null): string => (value === null || value === undefined ? '—' : `${value.toFixed(1)}%`);
