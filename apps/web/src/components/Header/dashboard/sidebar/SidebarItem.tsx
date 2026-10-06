'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from '@/components/ui/sidebar';
import { SideBarMenuDto } from '@/data/sidebarMenu';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

interface SidebarItemRendererProps {
  item: SideBarMenuDto;
  /** Whether this group is the one the user expanded; only one group stays open at a time. */
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  /** Keeps every group expanded, used while the menu search has text. */
  forceOpen?: boolean;
}

const normalize = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);

// Sub-routes (e.g. /admin/categories/create) highlight their parent item, while dashboard roots only
// match exactly so they don't light up on every page.
const matchesPath = (pathname: string, url?: string) => {
  if (!url) return false;
  const path = normalize(pathname);
  const target = normalize(url);
  const isRoot = target === '/' || target === '/admin' || target === '/dashboard';
  return isRoot ? path === target : path === target || path.startsWith(`${target}/`);
};

export const SidebarItemRenderer: React.FC<SidebarItemRendererProps> = ({ item, isOpen, onToggle, forceOpen = false }) => {
  const pathname = usePathname();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const Icon = item.icon;

  const children = item.submenu ?? [];
  const childActive = children.some((child) => matchesPath(pathname, child.url));
  const selfActive = matchesPath(pathname, item.url);
  const collapsed = state === 'collapsed' && !isMobile;

  // On mobile the sidebar is a sheet overlay; close it after navigating.
  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  if (children.length === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton tooltip={item.title} isActive={selfActive} asChild>
          <Link href={item.url || '#'} onClick={handleNavigate}>
            {Icon && <Icon />}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Icon rail: the group becomes a flyout so its children stay one click away.
  if (collapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip={item.title} isActive={childActive}>
              {Icon && <Icon />}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={8} className="min-w-48 rounded-lg">
            <DropdownMenuLabel className="text-xs text-muted-foreground">{item.title}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {children.map((child) => {
              const active = matchesPath(pathname, child.url);
              return (
                <DropdownMenuItem key={child.id} asChild className={cn(active && 'bg-primary/10 font-semibold text-primary focus:text-primary')}>
                  <Link href={child.url}>
                    {child.icon && <child.icon className="h-4 w-4" />}
                    <span>{child.title}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  const open = forceOpen || isOpen || childActive;

  return (
    <Collapsible asChild open={open} onOpenChange={onToggle} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} className={cn(childActive && 'text-primary')}>
            {Icon && <Icon />}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto !size-3.5 text-sidebar-foreground/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((child) => (
              <SidebarMenuSubItem key={child.id}>
                <SidebarMenuSubButton asChild isActive={matchesPath(pathname, child.url)}>
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
  );
};
