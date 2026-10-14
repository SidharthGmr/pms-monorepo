'use client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CheckCircle2, Plus, Trash2, XCircle } from 'lucide-react';

export interface SchemaEntry {
  text: string;
  error: string | null;
}

/** Parse one JSON-LD entry; an entry must be a single JSON object (an @graph wrapper counts). */
export const parseSchemaEntry = (text: string): { value: Record<string, unknown> | null; error: string | null } => {
  const trimmed = text.trim();
  if (!trimmed) return { value: null, error: 'Enter a JSON-LD object or remove this entry' };
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { value: null, error: 'Each entry must be one JSON object, e.g. { "@context": "https://schema.org", ... }' };
    }
    return { value: parsed as Record<string, unknown>, error: null };
  } catch (error) {
    return { value: null, error: `Invalid JSON: ${(error as Error).message}` };
  }
};

interface SchemaMarkupEditorProps {
  entries: SchemaEntry[];
  onChange: (entries: SchemaEntry[]) => void;
}

/**
 * A list of JSON-LD objects, each edited as raw JSON with live validation. @graph structures
 * are ordinary objects here and pass through untouched. The combined, valid entries render
 * as one script tag preview so the admin sees exactly what the page head will carry.
 */
export default function SchemaMarkupEditor({ entries, onChange }: SchemaMarkupEditorProps) {
  const updateEntry = (index: number, text: string) => {
    const next = [...entries];
    next[index] = { text, error: parseSchemaEntry(text).error };
    onChange(next);
  };

  const removeEntry = (index: number) => onChange(entries.filter((_, i) => i !== index));

  const addEntry = () =>
    onChange([...entries, { text: '{\n  "@context": "https://schema.org",\n  "@type": "WebPage"\n}', error: null }]);

  const validValues = entries.map((entry) => parseSchemaEntry(entry.text).value).filter((value): value is Record<string, unknown> => !!value);

  return (
    <div className="space-y-4">
      {entries.length === 0 && (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No schema markup yet. Add JSON-LD objects (Organization, FAQPage, @graph structures…) and they render in the page&apos;s head.
        </p>
      )}

      {entries.map((entry, index) => (
        <div key={index} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', entry.error ? 'text-destructive' : 'text-emerald-600')}>
              {entry.error ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Schema {index + 1} {entry.error ? '· invalid JSON' : '· valid'}
            </span>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeEntry(index)} title="Remove this schema">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Textarea
            value={entry.text}
            onChange={(e) => updateEntry(index, e.target.value)}
            rows={8}
            spellCheck={false}
            className={cn('font-mono text-xs', entry.error && 'border-destructive focus-visible:ring-destructive')}
          />
          {entry.error && <p className="text-xs text-destructive">{entry.error}</p>}
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addEntry}>
        <Plus className="h-3.5 w-3.5" />
        Add schema
      </Button>

      {validValues.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Rendered in &lt;head&gt; as:</p>
          <pre className="max-h-56 overflow-auto rounded-lg bg-muted/60 p-3 text-[11px] leading-relaxed">
            {`<script type="application/ld+json">\n${JSON.stringify(validValues.length === 1 ? validValues[0] : validValues, null, 2)}\n</script>`}
          </pre>
        </div>
      )}
    </div>
  );
}
