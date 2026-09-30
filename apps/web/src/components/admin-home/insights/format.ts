// Shared number formatting for the insights dashboard. Indian grouping to match the ₹ amounts
// the rest of the admin already shows.
export const formatMoney = (value: number, compact = false) =>
  `₹${value.toLocaleString('en-IN', compact ? { notation: 'compact', maximumFractionDigits: 1 } : { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const formatCount = (value: number) => value.toLocaleString('en-IN');

export const percentOf = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
