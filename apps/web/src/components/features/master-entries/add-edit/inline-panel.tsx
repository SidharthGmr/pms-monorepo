'use client';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import InlinePanel from '@/components/common/inline-panel';
import MasterEntryForm, { MasterEntryFormHandle } from './form';

interface AddMasterEntryPanelProps {
  isOpen: boolean;
  defaultAttributeId?: number;
  onClose: (refresh: boolean) => void;
}

// "Add Value" opens this above the search bar. The ref lets the page header's Close button
// run the same dirty check as Cancel and the X.
const AddMasterEntryPanel = forwardRef<MasterEntryFormHandle, AddMasterEntryPanelProps>(function AddMasterEntryPanel({ isOpen, defaultAttributeId, onClose }, ref) {
  const formRef = useRef<MasterEntryFormHandle>(null);
  useImperativeHandle(ref, () => ({ requestClose: () => formRef.current?.requestClose() }));

  return (
    <InlinePanel isOpen={isOpen} onRequestClose={() => formRef.current?.requestClose()} closeLabel="Close add value panel">
      <MasterEntryForm ref={formRef} defaultAttributeId={defaultAttributeId} variant="inline" onClose={onClose} />
    </InlinePanel>
  );
});

export default AddMasterEntryPanel;
