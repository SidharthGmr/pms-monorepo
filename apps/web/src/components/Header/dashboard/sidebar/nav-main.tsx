'use client';

import { useMemo, useState } from 'react';

import useLogout from '@/hooks/use-logout';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';

import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuSkeleton } from '@/components/ui/sidebar';

import CheckUserStatus from '@/components/account/check-user-status';
import { SideBarMenu, SideBarMenuDto } from '@/data/sidebarMenu';
import { SearchX } from 'lucide-react';
import { SidebarItemRenderer } from './SidebarItem';

interface NavMainProps {
  /** Text typed into the sidebar search; empty shows the full menu. */
  query?: string;
}

const UNGROUPED = '';

function SidebarSkeleton() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {Array.from({ length: 8 }).map((_, index) => (
            <SidebarMenuSkeleton key={index} showIcon />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// Items are filtered by role, then by the search text, then bucketed under their `group` label in
// the order the groups first appear in the menu data.
export function NavMain({ query = '' }: NavMainProps) {
  const { currentUser, status } = useGetCurrentUser();
  const logout = useLogout();
  const [openId, setOpenId] = useState<string | null>(null);

  const userRoles = useMemo<string[]>(() => {
    const role = currentUser?.role;
    if (!role) return [];
    return Array.isArray(role) ? role.filter(Boolean) : [role];
  }, [currentUser?.role]);

  const q = query.trim().toLowerCase();

  const sections = useMemo(() => {
    const visible = SideBarMenu.filter((item) => item.role?.some((role) => userRoles.includes(role)));

    const matches = (title: string) => !q || title.toLowerCase().includes(q);
    const searched: SideBarMenuDto[] = visible.flatMap((item) => {
      if (!item.submenu?.length) return matches(item.title) ? [item] : [];
      if (matches(item.title)) return [item];
      const children = item.submenu.filter((child) => matches(child.title));
      return children.length ? [{ ...item, submenu: children }] : [];
    });

    const order: string[] = [];
    const buckets = new Map<string, SideBarMenuDto[]>();
    for (const item of searched) {
      const key = item.group ?? UNGROUPED;
      if (!buckets.has(key)) {
        buckets.set(key, []);
        order.push(key);
      }
      buckets.get(key)!.push(item);
    }
    // Unlabelled items always sit at the bottom.
    order.sort((a, b) => (a === UNGROUPED ? 1 : b === UNGROUPED ? -1 : 0));
    return order.map((key) => ({ label: key, items: buckets.get(key)! }));
  }, [userRoles, q]);

  if (status === 'loading') return <SidebarSkeleton />;

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sidebar-foreground/60">
        <SearchX className="h-6 w-6" />
        <p className="text-xs">No menu item matches &ldquo;{query.trim()}&rdquo;.</p>
      </div>
    );
  }

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.label || 'other'} className="py-1.5">
          {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => (
                <SidebarItemRenderer key={item.id} item={item} isOpen={openId === item.id} onToggle={(next) => setOpenId(next ? item.id : null)} forceOpen={q.length > 0} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}

      <CheckUserStatus logout={logout} />
    </>
  );
}
