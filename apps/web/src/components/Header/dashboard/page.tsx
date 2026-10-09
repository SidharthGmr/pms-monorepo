'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import config from '@/config';
import { useGetUserById } from '@/hooks/service-hooks/useUserList.service.hook';
import useLogout from '@/hooks/use-logout';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { UserDto } from '@pms/types';
import { LogOut, Store, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BreadCrumb } from '../breadcrumb';
import { CartIndicator } from '../cart-indicator';
import { GlobalSearch } from '../global-search';
import { QuickCreate } from '../quick-create';
import { ModeToggle } from './sidebar/thememode';

const ICON = '/logo.svg';

export default function HeaderDashboard() {
  const { currentUser } = useGetCurrentUser();
  const userId = ((currentUser as any)?.userId ?? currentUser?.usersId ?? '') as string;
  const { data: userResponse, isLoading, isError } = useGetUserById(userId, !!userId);
  const userData = userResponse?.data?.data as UserDto | undefined;

  // Hooks must run on every render, so keep them above the early return.
  const logout = useLogout();
  const pathname = usePathname();

  if (!currentUser) return null;

  // Prefer the freshly fetched API values, falling back to the session.
  const name = userData?.name || currentUser.name || '';
  const email = userData?.email || currentUser.email || '';
  const profileImageUrl = userData?.profileImageUrl || '';
  const role = userData?.role || currentUser.role || '';
  const storeCode = userData?.storeCode || currentUser.storeCode || '';
  const profileHref = pathname.startsWith('/admin') ? '/admin/profile' : '/dashboard/profile';

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
      {/* On desktop the sidebar toggle leads the bar; on iPad and phones it moves to the far right. */}
      <SidebarTrigger className="-ml-1 hidden h-8 w-8 rounded-lg lg:flex" />

      <Link href="/" className="flex items-center lg:hidden" title={config.appName}>
        <Image src={ICON} width={28} height={28} alt={config.appName} className="h-7 w-7 object-contain dark:grayscale" />
      </Link>

      <Separator orientation="vertical" className="hidden h-5 md:block" />
      <div className="hidden min-w-0 md:block">
        <BreadCrumb />
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <GlobalSearch />
        <QuickCreate />
        <Separator orientation="vertical" className="hidden h-5 sm:block" />
        <CartIndicator />
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 rounded-full px-1 pr-1 md:pr-2.5" aria-label="Account menu">
              <Avatar className="h-7 w-7 ring-1 ring-border">
                {!isError && profileImageUrl && <AvatarImage src={profileImageUrl} className="object-cover" alt={name} />}
                <AvatarFallback className="bg-primary text-[11px] font-semibold uppercase text-primary-foreground">{name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[120px] truncate text-left text-sm font-medium md:block">{name.split(' ')[0]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-lg">
            <DropdownMenuLabel className="p-2 font-normal">
              {isLoading ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ) : isError ? (
                <span className="text-sm text-destructive">Failed to load profile</span>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {profileImageUrl && <AvatarImage src={profileImageUrl} className="object-cover" alt={name} />}
                    <AvatarFallback className="bg-primary text-xs font-semibold uppercase text-primary-foreground">{name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{name}</p>
                    {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {role && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{role}</span>}
                      {storeCode && <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{storeCode}</span>}
                    </div>
                  </div>
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={profileHref}>
                <UserRound className="h-4 w-4" />
                My profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/">
                <Store className="h-4 w-4" />
                View storefront
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={async () => {
                await logout();
              }}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SidebarTrigger className="h-8 w-8 rounded-lg lg:hidden" />
      </div>
    </header>
  );
}
