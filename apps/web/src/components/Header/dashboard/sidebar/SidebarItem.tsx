'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from '@/components/ui/sidebar';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { SideBarMenuDto } from '../../../../data/sidebarMenu';

interface SidebarItemRendererProps {
  item: SideBarMenuDto;
  index: number;
  openIndex: number | null;
  setOpenIndex: (index: number | null) => void;
  onClick?: () => void;
}

export const SidebarItemRenderer: React.FC<SidebarItemRendererProps> = ({ item, index, openIndex, setOpenIndex, onClick }) => {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const isOpen = openIndex === index;
  // const router = useRouter();
  const hasChildren = !!item.submenu?.length;
  const Icon = item.icon;

  // Highlight the current page. Sub-routes (e.g. /admin/categories/create) should
  // also highlight their parent nav item, while dashboard roots only match exactly
  // so they don't light up on every page.
  const normalize = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);
  const isActive = (url?: string) => {
    if (!url) return false;
    const path = normalize(pathname);
    const target = normalize(url);
    const isRoot = target === '/' || target === '/admin' || target === '/dashboard';
    return isRoot ? path === target : path === target || path.startsWith(`${target}/`);
  };

  const childActive = item.submenu?.some((child) => isActive(child.url)) ?? false;
  const matchPath = isActive(item.url) || childActive;

  // On mobile the sidebar is a sheet overlay; close it after navigating.
  const handleNavigate = () => {
    onClick?.();
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (!item.url && !item.submenu?.length) {
    return (
      <SidebarMenuSubItem key={item.id}>
        <SidebarMenuSubButton asChild isActive={false}>
          <div className="flex items-center cursor-pointer px-2 py-2" onClick={handleNavigate}>
            {Icon && <Icon />}
            <span>{item.title}</span>
          </div>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  return (
    <>
      {item.submenu?.length ? (
        <Collapsible
          asChild
          key={item.id}
          open={isOpen || matchPath}
          defaultOpen={isOpen || matchPath}
          onOpenChange={() => setOpenIndex(isOpen ? null : index)}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={item.title} isActive={matchPath} className=" ">
                {Icon && <Icon />}
                <span>{item.title}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <SidebarMenuSub>
                {item.submenu?.map((child) => (
                  <SidebarMenuSubItem key={child.id}>
                    <SidebarMenuSubButton asChild isActive={isActive(child.url)}>
                      <Link href={child.url} onClick={handleNavigate}>
                        {child.icon && <child.icon />}
                        <span>{child.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      ) : (
        <SidebarMenuSubItem key={item.id}>
          <SidebarMenuButton tooltip={item.title} isActive={matchPath} asChild>
            <Link href={item.url || ''} onClick={handleNavigate}>
              {Icon && <Icon />}
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuSubItem>
      )}
    </>
  );
};
