'use client';
import { useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import MasterEntryForm, { MasterEntryFormHandle } from './form';

interface ManageMasterEntryProps {
  id?: number;
  defaultAttributeId?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

// One dialog for Add and Edit: no id creates, an id edits.
// Escape and the X go through the form's dirty check; clicking outside does nothing so a stray click cannot discard edits.
export default function ManageMasterEntry({ id, defaultAttributeId, isOpen, onClose }: ManageMasterEntryProps) {
  const formRef = useRef<MasterEntryFormHandle>(null);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && formRef.current?.requestClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-xl" onInteractOutside={(e) => e.preventDefault()}>
        <MasterEntryForm ref={formRef} id={id} defaultAttributeId={defaultAttributeId} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
