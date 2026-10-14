'use client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateCmsPageModel } from '@pms/types';
import { useMemo } from 'react';

/** The same composition order the live page uses, so the preview is honest. */
export const composePreviewDocument = (values: CreateCmsPageModel, schemaObjects: Record<string, unknown>[]): string => {
  const schemaTag =
    schemaObjects.length > 0
      ? `<script type="application/ld+json">${JSON.stringify(schemaObjects.length === 1 ? schemaObjects[0] : schemaObjects)}</script>`
      : '';

  return [
    '<!DOCTYPE html>',
    '<html><head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${values.metaTitle || values.name || 'Page preview'}</title>`,
    values.preloadScript || '',
    values.headerScript || '',
    schemaTag,
    values.cssContent ? `<style>${values.cssContent}</style>` : '',
    '</head><body>',
    values.afterBodyScript || '',
    values.htmlContent || '<p style="font-family:sans-serif;color:#888;text-align:center;padding:4rem 1rem">Nothing on this page yet.</p>',
    values.jsContent ? `<script>${values.jsContent}</script>` : '',
    values.footerScript || '',
    '</body></html>',
  ]
    .filter(Boolean)
    .join('\n');
};

interface PreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  values: CreateCmsPageModel;
  schemaObjects: Record<string, unknown>[];
}

export default function PreviewDialog({ isOpen, onClose, values, schemaObjects }: PreviewDialogProps) {
  const doc = useMemo(() => (isOpen ? composePreviewDocument(values, schemaObjects) : ''), [isOpen, values, schemaObjects]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-[85vh] max-w-5xl gap-3 p-4">
        <DialogHeader className="space-y-0.5">
          <DialogTitle className="text-base">Preview: {values.name || 'Untitled page'}</DialogTitle>
          <DialogDescription>How the page content, CSS and scripts render. The site header/footer are not shown here.</DialogDescription>
        </DialogHeader>
        <iframe title="Page preview" sandbox="allow-scripts" srcDoc={doc} className="h-full w-full rounded-lg border bg-white" />
      </DialogContent>
    </Dialog>
  );
}
