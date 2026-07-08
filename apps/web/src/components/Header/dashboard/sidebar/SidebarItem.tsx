'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
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
  const isOpen = openIndex === index;
  // const router = useRouter();
  const hasChildren = !!item.submenu?.length;
  const Icon = item.icon;
  const matchPath = pathname === item.url || item.submenu?.some((child) => pathname === child.url);

  if (!item.url && !item.submenu?.length) {
    return (
      <SidebarMenuSubItem key={item.id}>
        <SidebarMenuSubButton asChild isActive={false}>
          <div className="flex items-center cursor-pointer px-2 py-2" onClick={onClick}>
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
                    <SidebarMenuSubButton asChild isActive={pathname === child.url}>
                      <Link href={child.url}>
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
          <SidebarMenuButton tooltip={item.title} isActive={matchPath} asChild className="">
            <Link href={item.url || ''} onClick={onClick} className="text-foreground">
              {Icon && <Icon />}
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuSubItem>
      )}
    </>
  );
};
