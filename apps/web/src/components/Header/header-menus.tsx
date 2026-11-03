'use client';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';

/**
 * One slot for the whole header: the id of the menu that is open, or null. Every icon menu
 * derives its own open flag from this, so opening one IS closing the others - two menus
 * being open at once is unrepresentable rather than merely prevented. Pair it with
 * `modal={false}` on the menus so the click that opens the next one is not swallowed by
 * the dismiss layer of the one it replaces.
 */
export type HeaderMenuId = 'quick-create' | 'cart' | 'notifications' | 'settings' | 'account';

const HeaderMenusContext = createContext<[HeaderMenuId | null, Dispatch<SetStateAction<HeaderMenuId | null>>] | null>(null);

export function HeaderMenusProvider({ children }: { children: ReactNode }) {
  const slot = useState<HeaderMenuId | null>(null);
  return <HeaderMenusContext.Provider value={slot}>{children}</HeaderMenusContext.Provider>;
}

/**
 * Radix-shaped `open`/`onOpenChange` for one named header menu. Outside the provider it
 * falls back to plain local state, so a menu rendered somewhere else keeps working alone.
 */
export function useHeaderMenu(id: HeaderMenuId): { open: boolean; onOpenChange: (open: boolean) => void } {
  const context = useContext(HeaderMenusContext);
  const [localOpen, setLocalOpen] = useState(false);

  if (!context) return { open: localOpen, onOpenChange: setLocalOpen };

  const [openMenu, setOpenMenu] = context;
  return {
    open: openMenu === id,
    // The close branch checks the id: menu A's dismiss event, arriving a tick after menu B
    // claimed the slot, must not wipe out B.
    onOpenChange: (open) => setOpenMenu((current) => (open ? id : current === id ? null : current)),
  };
}
