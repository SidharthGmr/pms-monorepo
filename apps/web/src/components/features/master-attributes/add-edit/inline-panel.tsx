'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import MasterAttributeForm, { MasterAttributeFormHandle } from './form';

interface AddMasterAttributePanelProps {
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

// "Add Attribute" opens this in place, just above the search bar, instead of a dialog - the list
// stays visible so what already exists can be checked while typing. Mounted only while open so
// every opening starts from blank defaults.
const AddMasterAttributePanel = forwardRef<MasterAttributeFormHandle, AddMasterAttributePanelProps>(function AddMasterAttributePanel({ isOpen, onClose }, ref) {
  const formRef = useRef<MasterAttributeFormHandle>(null);
  // Lets the page header's Close button run the same dirty check as Cancel and the X.
  useImperativeHandle(ref, () => ({ requestClose: () => formRef.current?.requestClose() }));
  const panelRef = useRef<HTMLDivElement>(null);

  // The panel can open below the fold on small screens; bring it into view.
  useEffect(() => {
    if (isOpen) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div ref={panelRef} className="animate-in fade-in slide-in-from-top-2 duration-200">
      <Card className={cn('relative overflow-hidden border border-primary/30 p-0 md:p-0 shadow-md ring-4 ring-primary/5')}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 h-8 w-8 text-muted-foreground"
          onClick={() => formRef.current?.requestClose()}
          aria-label="Close add attribute panel"
        >
          <X className="h-4 w-4" />
        </Button>
        <MasterAttributeForm ref={formRef} variant="inline" onClose={onClose} />
      </Card>
    </div>
  );
});

export default AddMasterAttributePanel;
