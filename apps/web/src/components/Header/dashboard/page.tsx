'use client';

import Logo from '@/components/common/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger } from '@/components/ui/sidebar';
import useLogout from '@/hooks/use-logout';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BreadCrumb } from '../breadcrumb';
import { ModeToggle } from './sidebar/thememode';
import { useGetUserById } from '@/hooks/service-hooks/useUserList.service.hook';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { UserDto } from '@pms/types';

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

  return (
    <>
      <header className="sticky top-0 z-20 w-full  border-b border-b-slate-200/50 shadow-sm">
        <Card className="!p-0 bg-card shadow-none rounded-0">
          <div className="flex justify-between items-center px-4 py-2">
            <div className="hidden xl:flex items-center justify-between gap-5">
              <SidebarTrigger className="   h-4 w-4  " />
              <BreadCrumb />
            </div>
            <div className="flex items-center justify-end gap-4">
              <div>
                <ModeToggle />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className={` flex justify-center  overflow-hidden items-center relative bg-blue size-12 rounded-full`}>
                  <Avatar className=" w-[30px] h-[30px]  ring-1 ring-primary ring-offset-[2px] ring-offset-background">
                    {!isError && profileImageUrl && <AvatarImage src={profileImageUrl} className="object-cover" alt={name} />}
                    <AvatarFallback className="uppercase bg-primary text-primary-foreground">{name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="p-3 border-b">
                    {isLoading ? (
                      <Skeleton className="h-4 w-28" />
                    ) : isError ? (
                      <span className="text-sm text-destructive">Failed to load profile</span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">Hey, {name.length > 12 ? `${name.substring(0, 12)}...` : name}</span>
                        {email && <span className="text-xs text-muted-foreground">{email}</span>}
                      </div>
                    )}
                  </div>

                  <DropdownMenuItem asChild>
                    <Link href={pathname.startsWith('/admin') ? '/admin/profile' : '/dashboard/profile'} className="w-full cursor-pointer">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await logout();
                    }}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="block xl:hidden">
                <Logo width={100} height={50} className="dark:grayscale w-[100px] h-[50px]" />
              </div>

              <div className="block xl:hidden">
                <SidebarTrigger className="" />
              </div>
            </div>
          </div>
        </Card>
      </header>
    </>
  );
}
