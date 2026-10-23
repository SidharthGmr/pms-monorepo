'use client';
import { LayoutGrid, LucideIcon, Sparkles, Target } from 'lucide-react';
import { useSyncExternalStore } from 'react';

/**
 * Which admin dashboard is shown. The choice is offered in two places - the pill on the
 * dashboard itself and the top-bar settings menu - so it lives in a tiny external store rather
 * than in either component: both subscribe, and picking in one updates the other immediately.
 * It is remembered per browser; storage can be blocked, so every access is guarded.
 */

export type DashboardVariant = 'focus' | 'insights' | 'bento';

export const DASHBOARD_VARIANTS: { value: DashboardVariant; label: string; icon: LucideIcon; hint: string }[] = [
  { value: 'focus', label: 'Focus', icon: Target, hint: 'What needs doing first' },
  { value: 'insights', label: 'Insights', icon: Sparkles, hint: 'The fuller analytical read' },
  { value: 'bento', label: 'Command', icon: LayoutGrid, hint: 'Live tiles at a glance' },
];

const STORAGE_KEY = 'admin.dashboard.variant';
const DEFAULT: DashboardVariant = 'focus';

const isVariant = (value: unknown): value is DashboardVariant => value === 'focus' || value === 'insights' || value === 'bento';

const listeners = new Set<() => void>();
let snapshot: DashboardVariant | null = null;

const read = (): DashboardVariant => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // 'ledger' is the retired third variant; anyone still carrying it lands on its replacement.
    if (stored === 'ledger') return 'bento';
    return isVariant(stored) ? stored : DEFAULT;
  } catch {
    return DEFAULT;
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // Another tab changing the preference fires `storage`; same-tab changes notify directly.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
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
const getSnapshot = (): DashboardVariant => {
  if (snapshot === null) snapshot = read();
  return snapshot;
};

// Server and first client render agree on the default; the stored choice lands right after.
const getServerSnapshot = (): DashboardVariant => DEFAULT;

export const setDashboardVariant = (next: DashboardVariant) => {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage blocked: the choice just lasts for this page load.
  }
  listeners.forEach((listener) => listener());
};

export const useDashboardVariant = (): DashboardVariant => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
