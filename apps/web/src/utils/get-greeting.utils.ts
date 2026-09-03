export function getGreeting(): string {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}


const PRICE_FORMAT = {decimals: 0,hideIfZeroCents: false};

export function  formatPrice(value: number) {
  const n = Number(value || 0);
  if (PRICE_FORMAT.hideIfZeroCents && Math.round(n * 100) % 100 === 0) {
    return n.toFixed(0);
  }
  return n.toFixed(PRICE_FORMAT.decimals);
}
