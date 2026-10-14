'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LOCALE_LABELS, LOCALES } from '@/i18n/config';
import { useLocale } from '@/i18n/locale-provider';
import { cn } from '@/lib/utils';
import { Check, Languages } from 'lucide-react';

/** Top-bar language picker. Each language is written in itself, so a Hindi reader can find it
 *  without reading English first. */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" title={t('common.language')} aria-label={t('common.language')}>
          <Languages className="h-[18px] w-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} collisionPadding={8} className="w-40 rounded-lg">
        {LOCALES.map((option) => (
          <DropdownMenuItem key={option} onSelect={() => setLocale(option)} className="gap-2">
            <Check className={cn('h-3.5 w-3.5 shrink-0', option === locale ? 'opacity-100' : 'opacity-0')} />
            <span lang={option}>{LOCALE_LABELS[option]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
