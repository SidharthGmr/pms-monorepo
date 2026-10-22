'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/context/theme-provider';
import { LOCALE_LABELS, LOCALES } from '@/i18n/config';
import { useLocale } from '@/i18n/locale-provider';
import { cn } from '@/lib/utils';
import { Check, Languages, Palette, Settings, SunMoon } from 'lucide-react';
import { THEME_COLORS, THEME_MODES } from './dashboard/sidebar/thememode';

/** The check that marks the active row in every submenu. */
function Tick({ on }: { on: boolean }) {
  return <Check className={cn('ml-auto h-3.5 w-3.5 shrink-0 text-primary', on ? 'opacity-100' : 'opacity-0')} />;
}

/** One dot per palette color, overlapped so a duotone reads as a pair at a glance. */
function Swatches({ colors }: { colors: readonly string[] }) {
  return (
    <span className="flex shrink-0 -space-x-1">
      {colors.map((color) => (
        <span key={color} className="h-3.5 w-3.5 rounded-full ring-1 ring-background" style={{ backgroundColor: color }} />
      ))}
    </span>
  );
}

/**
 * The top-bar settings menu: a gear icon whose dropdown carries the same theme and language
 * choices the bar used to show as separate icons, each behind a submenu so the closed menu
 * stays three rows tall. Theme is a single stored value, so picking a color palette implies
 * light mode and picking Dark/System steps off the palette.
 */
export function SettingsMenu() {
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();

  const mode = theme === 'dark' || theme === 'system' ? theme : 'light';
  const color = THEME_COLORS.some((option) => option.value === theme) ? theme : 'light';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" title="Settings" aria-label="Settings">
          <Settings className="h-[18px] w-[18px]" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} collisionPadding={8} className="w-56 rounded-lg">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <SunMoon className="h-4 w-4 text-muted-foreground" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40 rounded-lg" sideOffset={6} collisionPadding={8}>
            {THEME_MODES.map((option) => (
              <DropdownMenuItem key={option.value} onSelect={() => setTheme(option.value)} className="gap-2">
                {option.label}
                <Tick on={mode === option.value} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            Theme color
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44 rounded-lg" sideOffset={6} collisionPadding={8}>
            {THEME_COLORS.map((option) => (
              <DropdownMenuItem key={option.value} onSelect={() => setTheme(option.value)} className="gap-2">
                <Swatches colors={option.swatches} />
                {option.label}
                <Tick on={color === option.value} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            {t('common.language')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40 rounded-lg" sideOffset={6} collisionPadding={8}>
            {LOCALES.map((option) => (
              <DropdownMenuItem key={option} onSelect={() => setLocale(option)} className="gap-2">
                <span lang={option}>{LOCALE_LABELS[option]}</span>
                <Tick on={locale === option} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
