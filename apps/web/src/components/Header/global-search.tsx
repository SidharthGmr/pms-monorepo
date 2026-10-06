'use client';

import { Button } from '@/components/ui/button';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { SideBarMenu } from '@/data/sidebarMenu';
import { Roles } from '@/enums/roles.enum';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { Boxes, PackagePlus, Plus, Search, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface PageEntry {
  label: string;
  group: string;
  href: string;
  icon: any;
}

const QUICK_ACTIONS = [
  { label: 'New sale', href: '/admin/checkout', icon: ShoppingBag, keywords: 'checkout pay order' },
  { label: 'Add product', href: '/admin/products/add/', icon: PackagePlus, keywords: 'create product' },
  { label: 'Receive stock', href: '/admin/stock-purchase/', icon: Boxes, keywords: 'inventory purchase' },
  { label: 'Add category', href: '/admin/categories/', icon: Plus, keywords: 'create category' },
];

// Ctrl/Cmd+K palette over the same role-filtered menu the sidebar shows, so every page is one
// keystroke away even when the sidebar is collapsed or the user is on a phone.
export function GlobalSearch() {
  const router = useRouter();
  const { currentUser } = useGetCurrentUser();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const roles = useMemo<string[]>(() => {
    const role = currentUser?.role;
    if (!role) return [];
    return Array.isArray(role) ? role : [role];
  }, [currentUser?.role]);

  const pages = useMemo(() => {
    const out: PageEntry[] = [];
    for (const item of SideBarMenu) {
      if (!item.role.some((r) => roles.includes(r))) continue;
      const group = item.group ?? 'Other';
      if (item.url) out.push({ label: item.title, group, href: item.url, icon: item.icon });
      for (const child of item.submenu ?? []) {
        out.push({ label: child.title, group: item.title, href: child.url, icon: child.icon });
      }
    }
    return out;
  }, [roles]);

  const groups = useMemo(() => {
    const map = new Map<string, PageEntry[]>();
    for (const page of pages) {
      if (!map.has(page.group)) map.set(page.group, []);
      map.get(page.group)!.push(page);
    }
    return Array.from(map.entries());
  }, [pages]);

  const isAdmin = roles.includes(Roles.ADMIN);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 w-9 justify-start gap-2 rounded-lg px-0 text-muted-foreground md:w-56 md:px-3 lg:w-64"
        aria-label="Search pages and actions"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden flex-1 text-left text-sm font-normal md:inline">Search pages…</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground md:inline-flex">
          Ctrl K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Jump to a page or action…" />
        <CommandList>
          <CommandEmpty>Nothing matches.</CommandEmpty>
          {isAdmin && (
            <>
              <CommandGroup heading="Quick actions">
                {QUICK_ACTIONS.map((action) => (
                  <CommandItem key={action.href} value={`${action.label} ${action.keywords}`} onSelect={() => go(action.href)}>
                    <action.icon className="mr-2 text-primary" />
                    {action.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}
          {groups.map(([group, entries]) => (
            <CommandGroup key={group} heading={group}>
              {entries.map((page) => (
                <CommandItem key={page.href + page.label} value={`${page.label} ${group}`} onSelect={() => go(page.href)}>
                  {page.icon ? <page.icon className="mr-2 text-muted-foreground" /> : null}
                  {page.label}
                  <span className="ml-auto text-[11px] text-muted-foreground/70">{group}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
