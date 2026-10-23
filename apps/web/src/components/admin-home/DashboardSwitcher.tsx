'use client';
import { useDashboardVariant } from '@/hooks/use-dashboard-variant';
import DashboardBento from './insights/DashboardBento';
import DashboardFocus from './insights/DashboardFocus';
import DashboardInsights from './insights/DashboardInsights';

// Three readings of the same data: Focus leads with what needs doing, Insights is the fuller
// analytical read, and Command is a bento of live tiles read at a glance. The choice is made in
// the top-bar settings menu (use-dashboard-variant), so the page itself carries no switcher.
export default function DashboardSwitcher() {
  const variant = useDashboardVariant();

  if (variant === 'insights') return <DashboardInsights />;
  if (variant === 'bento') return <DashboardBento />;
  return <DashboardFocus />;
}
