'use client';

import { useCallback } from 'react';
import { useTranslations } from './locale-provider';

/**
 * Sidebar labels are plain English strings in `data/sidebarMenu.tsx`, so the English text is
 * also the message key. An item with no entry in the catalogue keeps its English name rather
 * than showing a raw `nav.items.…` key, which means a new menu item never renders broken.
 */
export function useNavLabel() {
  const t = useTranslations();

  return useCallback(
    (title: string, kind: 'items' | 'groups' = 'items') => {
      const key = `nav.${kind}.${title}`;
      const translated = t(key);
      return translated === key ? title : translated;
    },
    [t]
  );
}
