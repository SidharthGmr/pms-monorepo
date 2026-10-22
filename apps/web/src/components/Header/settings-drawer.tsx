'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/context/theme-provider';
import { LOCALE_LABELS, LOCALES } from '@/i18n/config';
import { useLocale } from '@/i18n/locale-provider';
import { cn } from '@/lib/utils';
import { Check, Languages, Palette, Settings } from 'lucide-react';
import { THEMES } from './dashboard/sidebar/thememode';

/** One row of the drawer: full-width and 40px tall, so it works as well with a thumb as a mouse. */
function OptionRow({ selected, onSelect, children, lang }: { selected: boolean; onSelect: () => void; children: React.ReactNode; lang?: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex h-10 w-full items-center gap-2.5 rounded-lg border px-3 text-sm transition-colors',
        selected ? 'border-primary/60 bg-primary/5 font-medium' : 'border-border hover:bg-muted'
      )}
    >
      <Check className={cn('h-4 w-4 shrink-0 text-primary', selected ? 'opacity-100' : 'opacity-0')} />
      <span lang={lang}>{children}</span>
    </button>
  );
}

/**
 * The top-bar settings drawer: a gear icon that slides a sheet in from the right with the
 * theme and language choices. It is the one home for both on every screen size, which keeps
 * the bar itself down to single-purpose icons.
 */
export function SettingsDrawer() {
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" title="Settings" aria-label="Settings">
          <Settings className="h-[18px] w-[18px]" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[19rem] p-0 sm:max-w-sm">
        <SheetHeader className="border-b px-4 py-3 text-left">
          <SheetTitle className="text-base">Settings</SheetTitle>
          <SheetDescription className="text-xs">Theme and language, remembered on this browser.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto p-4">
          <section className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Palette className="h-3.5 w-3.5" />
              Theme
            </p>
            <div className="space-y-1.5">
              {THEMES.map((option) => (
                <OptionRow key={option.value} selected={theme === option.value} onSelect={() => setTheme(option.value)}>
                  {option.label}
                </OptionRow>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Languages className="h-3.5 w-3.5" />
              {t('common.language')}
            </p>
            <div className="space-y-1.5">
              {LOCALES.map((option) => (
                <OptionRow key={option} selected={locale === option} onSelect={() => setLocale(option)} lang={option}>
                  {LOCALE_LABELS[option]}
                </OptionRow>
              ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
