export const LOCALES = ['en', 'hi'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Stored per browser, so a shared machine does not force one language on everyone. */
export const LOCALE_STORAGE_KEY = 'pms-locale';

/** Each language is written in itself - a reader looking for Hindi scans for हिन्दी, not "Hindi". */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
};

/** BCP 47 tags for Intl. `hi-IN` also brings the lakh/crore digit grouping, which `hi` alone does not. */
export const INTL_LOCALES: Record<Locale, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
};

export const isLocale = (value: unknown): value is Locale => typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
