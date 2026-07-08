'use client';

import { useMemo, useState } from 'react';

import { useGetUserById } from '@/hooks/service-hooks/useUserList.service.hook';
import useLogout from '@/hooks/use-logout';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';

import { SidebarGroup, SidebarMenu } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

import CheckUserStatus from '@/components/account/check-user-status';
import { SideBarMenu } from '@/data/sidebarMenu';
import { SidebarItemRenderer } from './SidebarItem';

type SidebarRole = string;

// const dashboardMenu = [
//   {
//     id: 'adminDashboard',
//     title: 'Dashboard',
//     url: '/admin/',
//     icon: MdOutlineDashboard,
//     role: [Roles.ADMIN],
//   },
//   {
//     id: 'userDashboard',
//     title: 'Dashboard',
//     url: '/dashboard/',
//     icon: MdOutlineDashboard,
//     role: [Roles.USER],
//   },
// ];

function SidebarSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}

export function NavMain() {
  const { currentUser } = useGetCurrentUser();
  const logout = useLogout();

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const userId = currentUser?.usersId ?? '';
  const { isLoading } = useGetUserById(userId);

  const userRoles = useMemo<SidebarRole[]>(() => {
    const role = currentUser?.role;

    if (!role) return [];

    if (Array.isArray(role)) {
      return role.filter(Boolean);
    }

    return [role];
  }, [currentUser?.role]);

  const menuItems = useMemo(() => {
    const allMenuItems = [...SideBarMenu];

    return allMenuItems.filter((item) => item.role?.some((role) => userRoles.includes(role)));
  }, [userRoles]);

  if (isLoading) {
    return <SidebarSkeleton />;
  }

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          {menuItems.map((item, index) => (
            <SidebarItemRenderer key={item.id} index={index} openIndex={openIndex} setOpenIndex={setOpenIndex} item={item} />
          ))}

          {/* <SidebarMenuSubItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <button type="button" onClick={logout} className="flex w-full cursor-pointer items-center gap-2">
                <TbLogout />
                <span>Log out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuSubItem> */}
        </SidebarMenu>
      </SidebarGroup>

      <CheckUserStatus logout={logout} />
    </>
  );
}
