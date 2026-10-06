'use client';

import ActiveUserSwitch from '@/components/account/active-user-switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { Roles } from '@/enums/roles.enum';
import useLogout from '@/hooks/use-logout';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { ChevronsUpDown, LogOut, Store, UserRound } from 'lucide-react';
import Link from 'next/link';

export function NavUser() {
  const { currentUser } = useGetCurrentUser();
  const { isMobile, setOpenMobile } = useSidebar();
  const logout = useLogout();

  const role = currentUser?.role;
  const profileHref = role === Roles.USER ? '/dashboard/edit-profile' : '/admin/profile';

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="rounded-lg data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <ActiveUserSwitch />
              <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side={isMobile ? 'top' : 'right'} align="end" sideOffset={6}>
            <DropdownMenuLabel className="flex flex-col gap-0.5 p-2 font-normal">
              <span className="truncate text-sm font-semibold">{currentUser?.name}</span>
              <span className="truncate text-xs text-muted-foreground">{currentUser?.email}</span>
              {role && <span className="mt-1 w-fit rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{role}</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={profileHref} onClick={closeOnMobile}>
                  <UserRound className="h-4 w-4" />
                  My profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/" onClick={closeOnMobile}>
                  <Store className="h-4 w-4" />
                  View storefront
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
