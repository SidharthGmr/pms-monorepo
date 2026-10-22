'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/context/theme-provider';
import { BsFillMoonStarsFill } from 'react-icons/bs';
import { IoMdSunny } from 'react-icons/io';

/** Light/dark/system on their own: picking one of these steps off any color palette. */
export const THEME_MODES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

/** Light palettes with their swatches: one swatch recolors --primary alone, two set the
 *  --primary/--secondary pair. 'light' doubles as the stock palette. */
export const THEME_COLORS = [
  { value: 'light', label: 'Default', swatches: ['hsl(214 85% 19%)', 'hsl(170 91% 36%)'] },
  { value: 'red', label: 'Red', swatches: ['hsl(0 72% 51%)'] },
  { value: 'green', label: 'Green', swatches: ['hsl(142 71% 45%)'] },
  { value: 'sunset', label: 'Sunset', swatches: ['hsl(25 95% 53%)', 'hsl(347 77% 50%)'] },
  { value: 'royal', label: 'Royal', swatches: ['hsl(262 83% 58%)', 'hsl(38 92% 50%)'] },
] as const;

/** Flat list for menus that offer every value in one run, e.g. the account menu on phones. */
export const THEMES = [
  ...THEME_MODES.slice(0, 2),
  ...THEME_COLORS.slice(1).map(({ value, label }) => ({ value, label })),
  THEME_MODES[2],
] as const;

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
          <IoMdSunny className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <BsFillMoonStarsFill className="absolute h-[1rem] w-[1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-lg">
        {THEMES.map((theme) => (
          <DropdownMenuItem key={theme.value} onClick={() => setTheme(theme.value)}>
            {theme.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
