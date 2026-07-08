

import { Skeleton } from '@/components/ui/skeleton';

export default function RecentPostSkeleton() {
    return (
        <div className="flex items-center gap-3 border-b py-2">
            <Skeleton className="w-16 h-12 rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
    );
}
