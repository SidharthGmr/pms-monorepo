'use client';

import { THEME_COLORS, THEME_MODES } from '@/components/Header/dashboard/sidebar/thememode';
import { useTheme } from '@/context/theme-provider';
import {
  DASHBOARD_VARIANTS,
  USER_DASHBOARD_VARIANTS,
  setDashboardVariant,
  setUserDashboardVariant,
  useDashboardVariant,
  useUserDashboardVariant,
} from '@/hooks/use-dashboard-variant';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { LOCALE_LABELS, LOCALES } from '@/i18n/config';
import { useLocale } from '@/i18n/locale-provider';
import { cn } from '@/lib/utils';
import { Roles } from '@pms/types';
import { Check, Languages, LayoutDashboard, Palette, SlidersHorizontal, SunMoon } from 'lucide-react';
import { ReactNode } from 'react';

const SURFACE = 'rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm';

const OPTION =
  'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const OPTION_ON = 'border-primary bg-primary/5';
const OPTION_OFF = 'border-border';

/** The check that marks the active option, same as the header menu's tick. */
function Tick({ on }: { on: boolean }) {
  return <Check className={cn('ml-auto h-4 w-4 shrink-0 text-primary', on ? 'opacity-100' : 'opacity-0')} />;
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

function Section({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/**
 * The header gear menu's choices - theme, theme color, dashboard layout, language - as a
 * Settings tab. Same stored values and hooks, so the two stay in step. Theme is a single
 * stored value: picking a color palette implies light mode and picking Dark/System steps
 * off the palette. The Dashboard section is role-aware, exactly like the menu.
 */
export default function PreferencesTab() {
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();
  const { currentUser } = useGetCurrentUser();
  const dashboardVariant = useDashboardVariant();
  const userDashboardVariant = useUserDashboardVariant();

  const mode = theme === 'dark' || theme === 'system' ? theme : 'light';
  const color = THEME_COLORS.some((option) => option.value === theme) ? theme : 'light';

  const role = currentUser?.role;
  const roles: string[] = !role ? [] : Array.isArray(role) ? role.filter(Boolean) : [role];
  const isAdmin = roles.some((item) => item === Roles.ADMIN || item === Roles.SUPER_ADMIN);
  const isCustomer = !isAdmin && roles.some((item) => item === Roles.USER);

  return (
    <section className={cn(SURFACE, 'overflow-hidden')}>
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <SlidersHorizontal className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-tight">Preferences</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Theme, dashboard layout and language. Saved on this device, applied right away.</p>
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-5">
        <Section icon={<SunMoon className="h-4 w-4" />} title="Theme" description="Light, dark, or follow this device's setting.">
          <div className="grid grid-cols-3 gap-2 sm:max-w-md">
            {THEME_MODES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={mode === option.value}
                className={cn(OPTION, mode === option.value ? OPTION_ON : OPTION_OFF)}
              >
                {option.label}
                <Tick on={mode === option.value} />
              </button>
            ))}
          </div>
        </Section>

        <Section icon={<Palette className="h-4 w-4" />} title="Theme color" description="Recolors the interface; picking a palette switches to light mode.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:max-w-2xl">
            {THEME_COLORS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={color === option.value}
                className={cn(OPTION, color === option.value ? OPTION_ON : OPTION_OFF)}
              >
                <Swatches colors={option.swatches} />
                {option.label}
                <Tick on={color === option.value} />
              </button>
            ))}
          </div>
        </Section>

        {(isAdmin || isCustomer) && (
          <Section icon={<LayoutDashboard className="h-4 w-4" />} title="Dashboard" description="The layout your dashboard opens with.">
            <div className="grid gap-2 sm:grid-cols-2 lg:max-w-2xl">
              {isAdmin
                ? DASHBOARD_VARIANTS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDashboardVariant(option.value)}
                      aria-pressed={dashboardVariant === option.value}
                      className={cn(OPTION, dashboardVariant === option.value ? OPTION_ON : OPTION_OFF)}
                    >
                      <option.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block leading-tight">{option.label}</span>
                        <span className="block text-[11px] leading-tight text-muted-foreground">{option.hint}</span>
                      </span>
                      <Tick on={dashboardVariant === option.value} />
                    </button>
                  ))
                : USER_DASHBOARD_VARIANTS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setUserDashboardVariant(option.value)}
                      aria-pressed={userDashboardVariant === option.value}
                      className={cn(OPTION, userDashboardVariant === option.value ? OPTION_ON : OPTION_OFF)}
                    >
                      <option.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block leading-tight">{option.label}</span>
                        <span className="block text-[11px] leading-tight text-muted-foreground">{option.hint}</span>
                      </span>
                      <Tick on={userDashboardVariant === option.value} />
                    </button>
                  ))}
            </div>
          </Section>
        )}

        <Section icon={<Languages className="h-4 w-4" />} title={t('common.language')} description="The language the interface is shown in.">
          <div className="grid grid-cols-2 gap-2 sm:max-w-md">
            {LOCALES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLocale(option)}
                aria-pressed={locale === option}
                className={cn(OPTION, locale === option ? OPTION_ON : OPTION_OFF)}
              >
                <span lang={option}>{LOCALE_LABELS[option]}</span>
                <Tick on={locale === option} />
              </button>
            ))}
          </div>
        </Section>
      </div>
    </section>
  );
}
