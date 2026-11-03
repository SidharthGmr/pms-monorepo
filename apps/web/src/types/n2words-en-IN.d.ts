// tsconfig uses moduleResolution "node", which cannot read n2words' exports-map types
// (its files live under src/); webpack resolves the real module at build time.
declare module 'n2words/en-IN' {
  export function toCardinal(value: number | string | bigint): string;
  export function toCurrency(value: number | string | bigint, options?: { and?: boolean }): string;
  export function toOrdinal(value: number | string | bigint): string;
}
