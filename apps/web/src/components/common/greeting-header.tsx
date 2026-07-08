// components/newsletter/greeting-header.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { Activity, Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useMemo } from 'react';
import { FaUser } from 'react-icons/fa6';
import { Badge } from '../ui/badge';

export default function GreetingHeader() {
  const { currentUser } = useGetCurrentUser();
  const { data: session, status } = useSession();
  const userName = useMemo(() => currentUser?.name?.trim() || 'User', [currentUser?.name]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Card className="!p-0  bg-transparent">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {greeting}, <span className="capitalize">{userName}!</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            Welcome back! Here's a quick overview of what's happening with your store today.
          </CardDescription>
          <small> {currentUser?.role} |  {currentUser?.storeCode}</small>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
          <Button icon={FaUser} variant="default" size="sm" effect={'expandIcon'} asChild >
            <Link href="/admin/settings/profile">
              Edit Profile
            </Link>
          </Button>
          <Button variant={'secondary'} iconPlacement="right" icon={Plus} size="sm" effect={'expandIcon'} asChild>
            <Link href="admin/purchase">
              Create Order
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
