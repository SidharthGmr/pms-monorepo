'use client';
import { History, LayoutGrid, LayoutPanelLeft, LucideIcon, Sparkles, Target } from 'lucide-react';
import { useSyncExternalStore } from 'react';

/**
 * Which dashboard layout is shown, one store per role: admins pick between Focus, Insights and
 * Command, customers between Overview and Timeline. The choice is offered in the top-bar
 * settings menu, so it lives in a tiny external store rather than in a component: every
 * subscriber updates immediately when it changes. It is remembered per browser; storage can be
 * blocked, so every access is guarded.
 */

export type DashboardVariant = 'focus' | 'insights' | 'bento';
export type UserDashboardVariant = 'overview' | 'activity';

export interface DashboardVariantOption<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
  hint: string;
}

export const DASHBOARD_VARIANTS: DashboardVariantOption<DashboardVariant>[] = [
  { value: 'focus', label: 'Focus', icon: Target, hint: 'What needs doing first' },
  { value: 'insights', label: 'Insights', icon: Sparkles, hint: 'The fuller analytical read' },
  { value: 'bento', label: 'Command', icon: LayoutGrid, hint: 'Live tiles at a glance' },
];

export const USER_DASHBOARD_VARIANTS: DashboardVariantOption<UserDashboardVariant>[] = [
  { value: 'overview', label: 'Overview', icon: LayoutPanelLeft, hint: 'Orders, refunds and profile side by side' },
  { value: 'activity', label: 'Timeline', icon: History, hint: 'Orders and returns as one feed' },
];

function createVariantStore<T extends string>(storageKey: string, fallback: T, parse: (stored: string | null) => T | null) {
  const listeners = new Set<() => void>();
  let snapshot: T | null = null;

  const read = (): T => {
    try {
      return parse(window.localStorage.getItem(storageKey)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    // Another tab changing the preference fires `storage`; same-tab changes notify directly.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      snapshot = null;
      listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  };

  // Cached so the snapshot is referentially stable between renders, which useSyncExternalStore requires.
  const getSnapshot = (): T => {
    if (snapshot === null) snapshot = read();
    return snapshot;
  };

  // Server and first client render agree on the default; the stored choice lands right after.
  const getServerSnapshot = (): T => fallback;

  const setVariant = (next: T) => {
    snapshot = next;
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // Storage blocked: the choice just lasts for this page load.
    }
    listeners.forEach((listener) => listener());
  };

  const useVariant = (): T => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return { setVariant, useVariant };
}

const adminStore = createVariantStore<DashboardVariant>('admin.dashboard.variant', 'focus', (stored) => {
  // 'ledger' is the retired third variant; anyone still carrying it lands on its replacement.
  if (stored === 'ledger') return 'bento';
  return stored === 'focus' || stored === 'insights' || stored === 'bento' ? stored : null;
});

const userStore = createVariantStore<UserDashboardVariant>('user.dashboard.variant', 'overview', (stored) =>
  stored === 'overview' || stored === 'activity' ? stored : null
);

export const setDashboardVariant = adminStore.setVariant;
export const useDashboardVariant = adminStore.useVariant;
export const setUserDashboardVariant = userStore.setVariant;
export const useUserDashboardVariant = userStore.useVariant;
