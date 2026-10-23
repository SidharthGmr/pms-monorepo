'use client';

import { useUserDashboardVariant } from '@/hooks/use-dashboard-variant';
import CustomerActivityDashboard from './activity';
import CustomerOverviewDashboard from './overview';

// Two readings of the same account: Overview puts orders, refunds and profile side by side,
// Timeline folds orders and returns into one chronological feed. The choice is made in the
// top-bar settings menu (use-dashboard-variant), so the page itself carries no switcher.
export default function CustomerDashboard() {
  const variant = useUserDashboardVariant();

  if (variant === 'activity') return <CustomerActivityDashboard />;
  return <CustomerOverviewDashboard />;
}
