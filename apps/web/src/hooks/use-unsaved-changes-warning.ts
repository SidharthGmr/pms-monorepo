'use client';

import { useEffect } from 'react';

/**
 * Warns the user before the browser unloads the page (tab close, reload, external navigation)
 * while a form still holds unsaved edits.
 *
 * Only `beforeunload` is handled on purpose. In-app navigation is guarded explicitly by the
 * calling form (see `StickyFormActions` + `ConfirmBox`) rather than by intercepting link
 * clicks, because the App Router has no supported navigation-block API and the
 * `popstate` + document-click approach used by `useQuizGuard` is acknowledged there as a hack.
 */
export default function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Browsers ignore custom text nowadays, but returnValue must be set to trigger the prompt.
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
}
