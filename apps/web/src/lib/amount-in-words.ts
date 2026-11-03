import { toCurrency } from 'n2words/en-IN';

/** Indian lakh/crore wording via n2words, e.g. "Six thousand eight hundred and sixteen rupees and seventy-four paise only". */
export const amountInWords = (value: number): string => {
  const words = toCurrency(Math.round(Math.abs(value) * 100) / 100);
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} only`;
};
