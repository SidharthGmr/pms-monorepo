'use client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useRef, useState } from 'react';
import BrandNameForm, { BrandNameFormHandle } from './form';
import BrandNameView from './view';

interface ManageBrandNameProps {
  id?: number;
  isOpen: boolean;
  /** `view` opens read-only with an Edit button; `edit` goes straight to the form. */
  mode?: 'view' | 'edit';
  onClose: (refresh: boolean) => void;
}

// One dialog for Add, View and Edit: no id creates, an id edits, and mode="view" opens read-only.
// Escape and the X go through the form's dirty check; clicking outside does nothing so a stray click cannot discard edits.
export default function ManageBrandName({ id, isOpen, mode = 'edit', onClose }: ManageBrandNameProps) {
  const formRef = useRef<BrandNameFormHandle>(null);
  const [editing, setEditing] = useState(mode === 'edit');

  // Reading needs no dirty check; only the form can have unsaved changes to guard.
  const requestClose = () => (editing ? formRef.current?.requestClose() : onClose(false));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && requestClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        {editing ? (
          <BrandNameForm ref={formRef} id={id} variant="dialog" onClose={onClose} />
        ) : (
          <BrandNameView id={id ?? 0} onEdit={() => setEditing(true)} onClose={() => onClose(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
