'use client';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import EachUserDetails from '.';

export default function EachUserWrapper({ userId }: { userId: string }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 gap-1 text-muted-foreground hover:text-foreground">
        <Link href="/admin/users">
          <ChevronLeft className="h-4 w-4" />
          Back to users
        </Link>
      </Button>

      <EachUserDetails userId={userId} />
    </div>
  );
}
