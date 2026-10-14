'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './messages/en.json';
import hi from './messages/hi.json';
import { DEFAULT_LOCALE, INTL_LOCALES, isLocale, Locale, LOCALE_STORAGE_KEY } from './config';

/**
 * App-wide language. Both catalogues are bundled - they are a few KB and swapping is instant,
 * which beats a fetch per switch. The locale lives in localStorage rather than the URL so no
 * route has to change shape; a link shared between an English and a Hindi reader still works,
 * each of them seeing it in their own language.
 */

const CATALOGUES: Record<Locale, unknown> = { en, hi };

type Replacements = Record<string, string | number>;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Dotted key, e.g. `notifications.title`. Falls back to English, then to the key itself. */
  t: (key: string, values?: Replacements) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const lookup = (catalogue: unknown, key: string): string | undefined => {
  const found = key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, catalogue);
  return typeof found === 'string' ? found : undefined;
};

const fill = (template: string, values?: Replacements): string =>
  values ? template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match)) : template;

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Always starts at the default so the server and the first client render agree; the stored
  // choice is applied in the effect below, which is after hydration.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(stored)) setLocaleState(stored);
    } catch {
      // Private windows and blocked site data both throw here; the default locale is fine.
    }
  }, []);

  // Screen readers and the browser's own hyphenation need the document to declare its language.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Not persisting is survivable - the choice still applies for this session.
    }
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const intlLocale = INTL_LOCALES[locale];
    return {
      locale,
      setLocale,
      t: (key, values) => fill(lookup(CATALOGUES[locale], key) ?? lookup(CATALOGUES[DEFAULT_LOCALE], key) ?? key, values),
      formatNumber: (number, options) => new Intl.NumberFormat(intlLocale, options).format(number),
      formatCurrency: (number, currency = 'INR') => new Intl.NumberFormat(intlLocale, { style: 'currency', currency }).format(number),
      formatDate: (date, options) => new Intl.DateTimeFormat(intlLocale, options ?? { dateStyle: 'medium' }).format(new Date(date)),
    };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within a LocaleProvider');
  return context;
}

/** Shorthand for the common case: `const t = useTranslations();` then `t('stock.out')`. */
export function useTranslations(): LocaleContextValue['t'] {
  return useLocale().t;
}
