'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileUp } from 'lucide-react';
import { useRef, useState } from 'react';

export interface ImportedHtml {
  title: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  css: string | null;
  headerScripts: string | null;
  preloadLinks: string | null;
  schemaJson: string[];
  bodyHtml: string;
}

/**
 * Pull a complete HTML document apart into the editor's fields: head metadata into SEO,
 * styles into Page CSS, head scripts into Header script, resource hints into Preload,
 * JSON-LD into Schema Markup, and the body into the content editor.
 */
export const parseFullHtml = (source: string): ImportedHtml => {
  const doc = new DOMParser().parseFromString(source, 'text/html');
  const head = doc.head;

  const meta = (name: string) => head.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || null;
  const og = (property: string) => head.querySelector(`meta[property="${property}"]`)?.getAttribute('content') || null;

  const schemaJson: string[] = [];
  head.querySelectorAll('script[type="application/ld+json"]').forEach((node) => {
    const text = node.textContent?.trim();
    if (text) schemaJson.push(text);
  });

  const headerScripts = Array.from(head.querySelectorAll('script:not([type="application/ld+json"])'))
    .map((node) => node.outerHTML)
    .join('\n');

  const preloadLinks = Array.from(head.querySelectorAll('link[rel="preload"], link[rel="preconnect"], link[rel="dns-prefetch"], link[rel="prefetch"], link[rel="modulepreload"]'))
    .map((node) => node.outerHTML)
    .join('\n');

  const css = Array.from(doc.querySelectorAll('style'))
    .map((node) => node.textContent ?? '')
    .join('\n\n')
    .trim();

  // Styles and JSON-LD were lifted into their own fields; drop them from the body so
  // nothing renders twice.
  const body = doc.body;
  body.querySelectorAll('style, script[type="application/ld+json"]').forEach((node) => node.remove());

  return {
    title: head.querySelector('title')?.textContent?.trim() || null,
    metaDescription: meta('description'),
    metaKeywords: meta('keywords'),
    canonicalUrl: head.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
    robots: meta('robots'),
    ogTitle: og('og:title'),
    ogDescription: og('og:description'),
    ogImageUrl: og('og:image'),
    css: css || null,
    headerScripts: headerScripts || null,
    preloadLinks: preloadLinks || null,
    schemaJson,
    bodyHtml: body.innerHTML.trim(),
  };
};

interface HtmlImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (imported: ImportedHtml) => void;
}

export default function HtmlImportDialog({ isOpen, onClose, onImport }: HtmlImportDialogProps) {
  const [source, setSource] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setSource(await file.text());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import full HTML</DialogTitle>
          <DialogDescription>
            Paste a complete HTML document (or upload an .html file). The title, metas, styles, scripts and JSON-LD are sorted into the matching
            tabs; the body becomes the page content.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          rows={12}
          spellCheck={false}
          placeholder="<!DOCTYPE html> …"
          className="font-mono text-xs"
        />

        <input ref={fileInputRef} type="file" accept=".html,.htm,text/html" className="hidden" onChange={(e) => void readFile(e.target.files)} />

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="h-4 w-4" />
            Upload .html file
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!source.trim()}
              onClick={() => {
                onImport(parseFullHtml(source));
                setSource('');
                onClose();
              }}
            >
              Import
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
