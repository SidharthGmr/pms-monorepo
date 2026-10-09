'use client';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInput, SidebarRail, useSidebar } from '@/components/ui/sidebar';
import config from '@/config';
import { Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';

const LOGO = '/logo-full.svg';
const ICON = '/logo.svg';

// Collapses to an icon rail on desktop (Ctrl/Cmd+B) and becomes a sheet on phones. The menu
// search only renders in the phone sheet - on desktop the top bar's Ctrl+K palette covers it.
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { open, isMobile } = useSidebar();
  const [query, setQuery] = React.useState('');

  const expanded = open || isMobile;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-3 border-b border-sidebar-border px-3 py-3 group-data-[collapsible=icon]:px-2">
        <Link href="/" title={config.appName} className="flex h-9 items-center justify-center rounded-lg outline-none ring-sidebar-ring focus-visible:ring-2">
          {expanded ? (
            <Image src={LOGO} width={160} height={40} alt={config.appName} priority className="h-8 w-auto max-w-[150px] object-contain dark:grayscale" />
          ) : (
            <Image src={ICON} width={32} height={32} alt={config.appName} priority className="h-7 w-7 object-contain dark:grayscale" />
          )}
        </Link>

        {isMobile && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <SidebarInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search menu" aria-label="Search menu" className="h-8 rounded-lg border-sidebar-border pl-8 pr-7 text-xs" />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="gap-0 py-1 [scrollbar-width:thin]">
        <NavMain query={query} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
