'use client';

import { Card, CardContent } from '@/components/ui/card';
import { PiCertificateFill } from 'react-icons/pi';
import { MdOutlineMenuBook } from 'react-icons/md';
import { FaStar } from 'react-icons/fa';
import { GiGraduateCap } from 'react-icons/gi';
import Header from '../Header';
import Banner from '../home/banner';
import AboutSection from '../home/about';
import { Footer } from '../footer';

type StatCard = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subLabel?: string;
};

const stats: StatCard[] = [
  {
    icon: PiCertificateFill,
    value: '8',
    label: 'Free Templates',
    subLabel: 'available',
  },
  {
    icon: MdOutlineMenuBook,
    value: '8',
    label: 'Added Templates',
    subLabel: 'in library',
  },
  {
    icon: FaStar,
    value: '4.4',
    label: 'Sent Templates',
    subLabel: 'avg rating',
  },
  {
    icon: GiGraduateCap,
    value: '2k+',
    label: 'Active Users',
    subLabel: 'this month',
  },
];

export default function DashboardStats() {
  return (
    <>
      <Header />

      <main className="min-h-screen ">
        <div className="container pt-16">
          <Banner
            title="AI-Powered HTML Email Development Platform"
            subtitle="Build, preview, test, and share bulletproof emails—without the pain."
            sectionTitle="Unlock Blocks"
            buttonText="Browse Email Templates"
            className="mb-8 gradient"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['AI Template Generator', 'Live Previews', 'Bulletproof Testing', 'Export Anywhere', 'Templates', 'Themes'].map((item) => (
              <div key={item} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-colors">
                <h3 className="text-xl font-semibold text-white mb-2">{item}</h3>
                <p className="text-gray-400">Explore our collection of {item.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </div>
        <AboutSection />
      </main>

      <Footer />

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <div className="text-3xl font-semibold tracking-tight">{item.value}</div>
                  {item.subLabel ? <p className="text-xs text-muted-foreground">{item.subLabel}</p> : null}
                </div>

                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/40">
                  <item.icon className="h-5 w-5 text-foreground/80" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
