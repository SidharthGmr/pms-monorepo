const wholeRupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const withPaise = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Rupee amount, showing paise only when there are any - so a round price reads as
 * "₹1,099" rather than "₹1,099.00".
 */
export const formatPrice = (value: number): string => (Number.isInteger(value) ? wholeRupees : withPaise).format(value);
