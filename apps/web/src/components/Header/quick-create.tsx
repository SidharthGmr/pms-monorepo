'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Roles } from '@/enums/roles.enum';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { Boxes, FolderTree, PackagePlus, Plus, ShoppingBag, Tags, UserPlus } from 'lucide-react';
import Link from 'next/link';

const ACTIONS = [
  { label: 'New sale', hint: 'Take payment for the cart', href: '/admin/checkout', icon: ShoppingBag },
  { label: 'Add product', hint: 'Create a product and its variants', href: '/admin/products/add/', icon: PackagePlus },
  { label: 'Receive stock', hint: 'Book a purchase from a supplier', href: '/admin/stock-purchase/', icon: Boxes },
  { label: 'Add category', href: '/admin/categories/', icon: FolderTree },
  { label: 'Add brand', href: '/admin/brand-names/', icon: Tags },
  { label: 'Add user', href: '/admin/users/', icon: UserPlus },
];

// One-click entry points for the things an admin creates most. Hidden for everyone else.
export function QuickCreate() {
  const { currentUser } = useGetCurrentUser();
  if (currentUser?.role !== Roles.ADMIN) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 rounded-lg px-2.5 sm:px-3" aria-label="Create">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-lg">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Create</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ACTIONS.map((action, i) => (
          <DropdownMenuItem key={action.href} asChild className={i === 3 ? 'mt-1 border-t pt-2' : undefined}>
            <Link href={action.href} className="flex items-start gap-2.5">
              <action.icon className="mt-0.5 h-4 w-4 text-primary" />
              <span className="min-w-0">
                <span className="block text-sm">{action.label}</span>
                {action.hint && <span className="block text-[11px] text-muted-foreground">{action.hint}</span>}
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
