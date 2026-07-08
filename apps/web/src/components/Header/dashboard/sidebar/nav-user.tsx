'use client';

import { ChevronsUpDown, LogOut } from 'lucide-react';

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
import useLogout from '@/hooks/use-logout';
import Link from 'next/link';
import { FaRegUser } from 'react-icons/fa';
import { Roles } from '@/enums/roles.enum';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import ActiveUserSwitch from '@/components/account/active-user-switch';

export function NavUser() {
  const currentUser = useGetCurrentUser();
  const currentUserRole = currentUser?.currentUser?.role;
  const { isMobile } = useSidebar();
  const logout = useLogout();

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ">
                <ActiveUserSwitch />
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg "
              side={isMobile ? 'bottom' : 'right'}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal ">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <ActiveUserSwitch />
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {currentUserRole !== Roles.USER && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/account/edit-profile">
                      <FaRegUser /> My Profile
                    </Link>
                  </DropdownMenuItem>
                )}

                {/* <DropdownMenuItem onClick={() => openChangePasswordModal(0)}>
                  <Bell />
                  Change Password
                </DropdownMenuItem> */}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await logout();
                }}
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
