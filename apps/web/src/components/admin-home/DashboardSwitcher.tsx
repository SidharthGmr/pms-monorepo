'use client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Sparkles, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardSummary from './DashboardSummary';
import DashboardFocus from './insights/DashboardFocus';
import DashboardInsights from './insights/DashboardInsights';

type DashboardVariant = 'focus' | 'insights' | 'classic';

const VARIANTS: { value: DashboardVariant; label: string; icon: typeof Sparkles }[] = [
  { value: 'focus', label: 'Focus', icon: Target },
  { value: 'insights', label: 'Insights', icon: Sparkles },
  { value: 'classic', label: 'Classic', icon: LayoutDashboard },
];

// Remembered per browser so the choice sticks between visits. Wrapped because storage can be blocked.
const STORAGE_KEY = 'admin.dashboard.variant';
const readStored = (): DashboardVariant | null => {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'classic' || v === 'insights' || v === 'focus' ? v : null;
  } catch {
    return null;
  }
};

// Three dashboards over the same data: Focus leads with what needs doing, Insights is the
// fuller analytical read, and Classic is the original DashboardSummary. Focus is the default;
// the stored preference is applied after mount so server and first client render agree.
export default function DashboardSwitcher() {
  const [variant, setVariant] = useState<DashboardVariant>('focus');

  useEffect(() => {
    const stored = readStored();
    if (stored) setVariant(stored);
  }, []);

  const change = (next: DashboardVariant) => {
    setVariant(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice just lasts for this page load.
    }
  };

  const toolbar = (
    <div className="inline-flex h-9 items-center rounded-lg border bg-background p-0.5" role="radiogroup" aria-label="Dashboard layout">
      {VARIANTS.map(({ value, label, icon: Icon }) => {
        const active = value === variant;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => change(value)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
              active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );

  if (variant === 'classic') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">{toolbar}</div>
        <DashboardSummary />
      </div>
    );
  }

  if (variant === 'insights') {
    return <DashboardInsights toolbar={toolbar} />;
  }

  return <DashboardFocus toolbar={toolbar} />;
}
