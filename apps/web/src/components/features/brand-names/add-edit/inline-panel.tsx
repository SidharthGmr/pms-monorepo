'use client';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import InlinePanel from '@/components/common/inline-panel';
import BrandNameForm, { BrandNameFormHandle } from './form';

interface AddBrandNamePanelProps {
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

// "Add New Brand" opens this above the search bar. The ref lets the page header's Close button
// run the same dirty check as Cancel and the X.
const AddBrandNamePanel = forwardRef<BrandNameFormHandle, AddBrandNamePanelProps>(function AddBrandNamePanel({ isOpen, onClose }, ref) {
  const formRef = useRef<BrandNameFormHandle>(null);
  useImperativeHandle(ref, () => ({ requestClose: () => formRef.current?.requestClose() }));

  return (
    <InlinePanel isOpen={isOpen} onRequestClose={() => formRef.current?.requestClose()} closeLabel="Close add brand panel">
      <BrandNameForm ref={formRef} variant="inline" onClose={onClose} />
    </InlinePanel>
  );
});

export default AddBrandNamePanel;
