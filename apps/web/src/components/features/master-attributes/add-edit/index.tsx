'use client';
import { useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import MasterAttributeForm, { MasterAttributeFormHandle } from './form';

interface ManageMasterAttributeProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

// One dialog for Add and Edit: no id creates, an id edits.
export default function ManageMasterAttribute({ id, isOpen, onClose }: ManageMasterAttributeProps) {
  const formRef = useRef<MasterAttributeFormHandle>(null);

  return (
    // Escape and the X go through the form's dirty check; clicking outside does nothing so a stray click cannot discard edits.
    <Dialog open={isOpen} onOpenChange={(open) => !open && formRef.current?.requestClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-xl" onInteractOutside={(e) => e.preventDefault()}>
        <MasterAttributeForm ref={formRef} id={id} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
