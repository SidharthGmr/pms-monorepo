'use client';
import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InlinePanelProps {
  isOpen: boolean;
  /** Fired by the X; the owner decides whether a dirty form should confirm first. */
  onRequestClose: () => void;
  children: ReactNode;
  closeLabel?: string;
  className?: string;
}

// An in-page panel for an add form, shown above a list instead of a dialog so the list stays
// visible while typing. Mounted only while open so every opening starts from blank defaults,
// and scrolled into view because it can open below the fold on small screens.
export default function InlinePanel({ isOpen, onRequestClose, children, closeLabel = 'Close panel', className }: InlinePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div ref={panelRef} className="animate-in fade-in slide-in-from-top-2 duration-200">
      <Card className={cn('relative overflow-hidden border border-primary/30 p-0 shadow-md ring-4 ring-primary/5 md:p-0', className)}>
        <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-2 z-10 h-8 w-8 text-muted-foreground" onClick={onRequestClose} aria-label={closeLabel}>
          <X className="h-4 w-4" />
        </Button>
        {children}
      </Card>
    </div>
  );
}
