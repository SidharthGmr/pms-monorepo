import { Card } from '@/components/ui/card';
import { Clock, DollarSign, Package, Tags, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

type StatCardProps = {
  icon: React.ElementType;
  title: string;
  total: number;
  recentCount?: number;
  trend?: number;
  iconColor: string;
  bgColor: string;
  href: string;
  isCurrency?: boolean;
};

const StatCard = ({
  icon: Icon,
  title,
  total,
  recentCount,
  trend,
  bgColor,
  href,
  isCurrency
}: StatCardProps) => {
  const theme = bgColor.includes('emerald') ? 'emerald'
    : bgColor.includes('purple') ? 'purple'
      : bgColor.includes('blue') ? 'blue'
        : bgColor.includes('teal') ? 'teal'
          : bgColor.includes('green') ? 'green'
            : 'indigo';

  const themeClasses = {
    emerald: {
      borderGradient: 'from-emerald-400 via-emerald-100 to-emerald-500 dark:from-emerald-600 dark:via-emerald-900 dark:to-emerald-600',
      hoverBorderGradient: 'group-hover:from-emerald-500 group-hover:via-emerald-300 group-hover:to-emerald-600',
      bgGlow: 'from-emerald-500/10 to-transparent',
      iconBgGradient: 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/40 text-white',
      pulseDot: 'bg-emerald-500',
    },
    purple: {
      borderGradient: 'from-purple-400 via-purple-100 to-purple-500 dark:from-purple-600 dark:via-purple-900 dark:to-purple-600',
      hoverBorderGradient: 'group-hover:from-purple-500 group-hover:via-purple-300 group-hover:to-purple-600',
      bgGlow: 'from-purple-500/10 to-transparent',
      iconBgGradient: 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-purple-500/40 text-white',
      pulseDot: 'bg-purple-500',
    },
    blue: {
      borderGradient: 'from-blue-400 via-blue-100 to-blue-500 dark:from-blue-600 dark:via-blue-900 dark:to-blue-600',
      hoverBorderGradient: 'group-hover:from-blue-500 group-hover:via-blue-300 group-hover:to-blue-600',
      bgGlow: 'from-blue-500/10 to-transparent',
      iconBgGradient: 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/40 text-white',
      pulseDot: 'bg-blue-500',
    },
    teal: {
      borderGradient: 'from-teal-400 via-teal-100 to-teal-500 dark:from-teal-600 dark:via-teal-900 dark:to-teal-600',
      hoverBorderGradient: 'group-hover:from-teal-500 group-hover:via-teal-300 group-hover:to-teal-600',
      bgGlow: 'from-teal-500/10 to-transparent',
      iconBgGradient: 'bg-gradient-to-br from-teal-400 to-teal-600 shadow-teal-500/40 text-white',
      pulseDot: 'bg-teal-500',
    },
    green: {
      borderGradient: 'from-green-400 via-green-100 to-green-500 dark:from-green-600 dark:via-green-900 dark:to-green-600',
      hoverBorderGradient: 'group-hover:from-green-500 group-hover:via-green-300 group-hover:to-green-600',
      bgGlow: 'from-emerald-500/10 to-transparent',
      iconBgGradient: 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/40 text-white',
      pulseDot: 'bg-emerald-500',
    },
    indigo: {
      borderGradient: 'from-primary/50 via-primary/20 to-primary/50',
      hoverBorderGradient: 'group-hover:from-primary group-hover:via-primary/40 group-hover:to-primary',
      bgGlow: 'from-indigo-500/10 to-transparent',
      iconBgGradient: 'bg-gradient-to-br from-primary/80 to-primary shadow-primary/40 text-white',
      pulseDot: 'bg-indigo-500',
    }
  }[theme];

  return (
    <Link href={href} className="block h-full group">
      <div className={`relative h-full rounded-[1.8rem] bg-gradient-to-br ${themeClasses.borderGradient} ${themeClasses.hoverBorderGradient} p-[1.5px] transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1.5 cursor-pointer`}>
        <Card className="relative overflow-hidden bg-background/95 border-0 h-full rounded-[calc(1.8rem-1.5px)] p-5 flex flex-col justify-between min-h-[165px]">
          
          {/* Glow Element */}
          <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-35 group-hover:opacity-55 transition-opacity duration-500 bg-gradient-to-br ${themeClasses.bgGlow}`} />

          <div className="relative z-10 flex items-start justify-between w-full mt-1">
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 block">
                {title}
              </span>
              <div className="text-3xl font-black tracking-tight text-foreground transition-all duration-300 truncate">
                {isCurrency ? `$${total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : total?.toLocaleString()}
              </div>
            </div>

            {/* Solid Gradient Icon Style from attachment */}
            <div className={`relative flex items-center justify-center w-11 h-11 rounded-2xl shadow-md ${themeClasses.iconBgGradient} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shrink-0`}>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none" />
              <Icon className="h-5 w-5 relative z-10 text-white drop-shadow-sm" />
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between mt-5 pt-3 border-t border-border/20 w-full">
            {trend !== undefined ? (
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider ${trend >= 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{trend >= 0 ? '+' : ''}{trend}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[9px] font-extrabold tracking-wider bg-slate-500/5 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">
                <span className={`w-1.5 h-1.5 rounded-full animate-ping mr-1 ${themeClasses.pulseDot}`} />
                <span>ACTIVE</span>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${themeClasses.pulseDot} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${themeClasses.pulseDot}`}></span>
              </span>
              {recentCount !== undefined ? (
                <span><strong className="text-foreground font-bold">{recentCount}</strong> new</span>
              ) : (
                <span>Live synced</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Link>
  );
};

interface DashboardStatsProps {
  summaryData: any;
}

export default function DashboardStats({ summaryData }: DashboardStatsProps) {
  if (!summaryData) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={DollarSign}
        title="Today's Sale"
        total={summaryData.todaySale || 0}
        isCurrency={true}
        iconColor="text-emerald-600 dark:text-emerald-400"
        bgColor="bg-emerald-50 dark:bg-emerald-950/40"
        href="/admin/orders"
      />
      <StatCard
        icon={DollarSign}
        title="Total Month Sale"
        total={summaryData.totalMonthSale || 0}
        isCurrency={true}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-50 dark:bg-purple-950/40"
        href="/admin/orders"
      />
      <StatCard
        icon={Package}
        title="Total Products"
        total={summaryData.products?.total || 0}
        recentCount={summaryData.products?.recent?.length || 0}
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-50 dark:bg-blue-950/40"
        href="/admin/products"
      />
      <StatCard
        icon={Tags}
        title="Total Attributes"
        total={summaryData.attributes?.total || 0}
        recentCount={summaryData.attributes?.recent?.length || 0}
        iconColor="text-teal-600 dark:text-teal-400"
        bgColor="bg-teal-50 dark:bg-teal-950/40"
        href="/admin/attributes"
      />
    </div>
  );
}
