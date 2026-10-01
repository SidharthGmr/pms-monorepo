'use client';
import { useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import BrandNameForm, { BrandNameFormHandle } from './form';

interface ManageBrandNameProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

// The dialog is used for Edit. Adding happens in the inline panel above the list (see ./inline-panel.tsx).
// Escape and the X go through the form's dirty check; clicking outside does nothing so a stray click cannot discard edits.
export default function ManageBrandName({ id, isOpen, onClose }: ManageBrandNameProps) {
  const formRef = useRef<BrandNameFormHandle>(null);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && formRef.current?.requestClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <BrandNameForm ref={formRef} id={id} variant="dialog" onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
