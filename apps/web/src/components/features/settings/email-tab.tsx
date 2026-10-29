'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import {
  useGetAllEmailTemplates,
  usePreviewEmailTemplate,
  useResetEmailTemplate,
  useSendTestEmailTemplate,
  useUpdateEmailTemplate,
} from '@/hooks/service-hooks/useEmailTemplateService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Editor } from '@monaco-editor/react';
import { EMAIL_TEMPLATE_BRAND_VARIABLES, EmailTemplateDto } from '@pms/types';
import { AlertCircle, Code2, Eye, Mail, RotateCcw, Save, SendHorizonal } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

const SURFACE = 'rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm';

export default function EmailTemplatesEditor() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const { data: getAllEmailTemplatesResponse, isLoading: loading, isError } = useGetAllEmailTemplates();

  const updateTemplate = useUpdateEmailTemplate();
  const resetTemplate = useResetEmailTemplate();
  const previewTemplate = usePreviewEmailTemplate();
  const sendTestTemplate = useSendTestEmailTemplate();

  const templates = useMemo<EmailTemplateDto[]>(() => getAllEmailTemplatesResponse?.data?.data ?? [], [getAllEmailTemplatesResponse]);

  const [selectedKey, setSelectedKey] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [activeView, setActiveView] = useState<'code' | 'preview'>('code');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const previewLoading = previewTemplate.isPending;
  const saving = updateTemplate.isPending;
  const sendingTest = sendTestTemplate.isPending;

  const selected = templates.find((t) => t.key === selectedKey);
  const dirty = !!selected && (subject !== selected.subject || html !== selected.html);
  useUnsavedChangesWarning(dirty);

  const customizedCount = templates.filter((template) => template.isCustomized).length;

  const errorMessage = (error: unknown) => unitOfService.ErrorHandlerService.getErrorMessage(error as never);

  // The first template is selected once the list arrives; after that the choice is the user's.
  useEffect(() => {
    if (templates.length > 0) setSelectedKey((current) => current || templates[0].key);
  }, [templates]);

  // Selecting a template loads its saved (or default) subject/body into the editor.
  useEffect(() => {
    const template = templates.find((t) => t.key === selectedKey);
    if (template) {
      setSubject(template.subject);
      setHtml(template.html);
      setActiveView('code');
      setPreviewHtml('');
      setPreviewSubject('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, templates]);

  // Only the editor fields are synced here; the list itself comes back via query invalidation.
  const applyUpdated = (updated: EmailTemplateDto) => {
    setSubject(updated.subject);
    setHtml(updated.html);
  };

  const refreshPreview = async () => {
    if (!selected) return;
    try {
      const response = await previewTemplate.mutateAsync({ key: selected.key, model: { subject, html } });
      setPreviewHtml(response.data.data?.html ?? '');
      setPreviewSubject(response.data.data?.subject ?? '');
    } catch (error) {
      toast({ title: 'Preview failed', description: errorMessage(error), variant: 'destructive' });
    }
  };

  const showView = (view: 'code' | 'preview') => {
    setActiveView(view);
    if (view === 'preview') void refreshPreview();
  };

  // Both mutations invalidate the templates query, so the list re-reads itself; applyUpdated
  // only syncs the editor fields so the form is not left looking dirty against stale state.
  const save = async () => {
    if (!selected) return;
    try {
      const response = await updateTemplate.mutateAsync({ key: selected.key, model: { subject, html } });
      if (response.data.data) applyUpdated(response.data.data);
      toast({ title: 'Template saved', description: `"${selected.name}" will now be sent with your customised version.` });
    } catch (error) {
      toast({ title: 'Save failed', description: errorMessage(error), variant: 'destructive' });
    }
  };

  const reset = async () => {
    if (!selected) return;
    try {
      const response = await resetTemplate.mutateAsync(selected.key);
      if (response.data.data) applyUpdated(response.data.data);
      toast({ title: 'Template reset', description: `"${selected.name}" is back to the built-in default.` });
    } catch (error) {
      toast({ title: 'Reset failed', description: errorMessage(error), variant: 'destructive' });
    }
  };

  const sendTest = async () => {
    if (!selected) return;
    try {
      const response = await sendTestTemplate.mutateAsync({ key: selected.key, model: { subject, html } });
      toast({ title: 'Test email sent', description: response.data.message });
    } catch (error) {
      toast({ title: 'Test send failed', description: errorMessage(error), variant: 'destructive' });
    }
  };

  const insertVariable = (variable: string) => {
    const token = `{{${variable}}}`;
    const textarea = bodyRef.current;
    if (!textarea) {
      setHtml((current) => current + token);
      return;
    }
    const start = textarea.selectionStart ?? html.length;
    const end = textarea.selectionEnd ?? html.length;
    setHtml((current) => current.slice(0, start) + token + current.slice(end));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  };

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn(SURFACE, 'flex items-center gap-3 px-4 py-6 sm:px-5')}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Could not load email templates</p>
          <p className="text-xs text-muted-foreground">Refresh the page to try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-5">
      <div className={cn(SURFACE, 'flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5')}>
        <p className="text-sm text-muted-foreground">Saved changes apply to every real send; reset returns a template to its built-in default.</p>
        <span className="ml-auto shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {customizedCount} of {templates.length} customised
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start">
        <nav className={cn(SURFACE, 'overflow-hidden lg:sticky lg:top-[72px]')} aria-label="Email templates">
          <div className="border-b border-border/70 px-4 py-3">
            <h2 className="text-sm font-semibold">Templates</h2>
          </div>
          <div className="max-h-[560px] overflow-y-auto p-2">
            {templates.map((template) => {
              const active = template.key === selectedKey;
              return (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => setSelectedKey(template.key)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'relative flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition',
                    active ? 'bg-primary/10' : 'hover:bg-accent/60'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition',
                      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className={cn('truncate text-sm font-medium', active && 'text-primary')}>{template.name}</span>
                      {template.isCustomized && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" title="Customised" aria-label="Customised" />
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{template.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {selected && (
          <section className={cn(SURFACE, 'overflow-hidden')}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-semibold">{selected.name}</h2>
                  {selected.isCustomized && (
                    <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      Customised
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{selected.description}</p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={SendHorizonal}
                  iconPlacement="left"
                  loading={sendingTest}
                  onClick={sendTest}
                  disabled={sendingTest}
                >
                  Send test
                </Button>
                {selected.isCustomized && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" icon={RotateCcw} iconPlacement="left">
                        Reset
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset &quot;{selected.name}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Your customised subject and body will be deleted and the built-in default template will be sent again. This cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={reset}>Reset template</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button size="sm" icon={Save} iconPlacement="left" loading={saving} onClick={save} disabled={!dirty || saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 p-4 sm:p-5">
              <div className="grid gap-1.5">
                <Label htmlFor="email-template-subject" className="text-xs font-medium text-foreground/80">
                  Subject
                </Label>
                <Input id="email-template-subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-foreground/80">Variables</Label>
                <div className="flex flex-wrap gap-1.5">
                  {selected.variables.map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => insertVariable(variable)}
                      className="rounded-md border border-border/70 bg-muted/50 px-2 py-1 font-mono text-[11px] text-foreground/80 transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                    >
                      {`{{${variable}}}`}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click a variable to insert it at the cursor. Brand values ({EMAIL_TEMPLATE_BRAND_VARIABLES.map((v) => `{{${v}}}`).join(', ')}) are
                  filled automatically on every send.
                </p>
              </div>

              {/* A two-button segmented switch rather than a nested tab bar, which would read as a
                  second level of the page's own section nav. */}
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-border/70 bg-muted/50 p-0.5">
                  {(
                    [
                      { key: 'code', label: 'HTML', icon: Code2 },
                      { key: 'preview', label: 'Preview', icon: Eye },
                    ] as const
                  ).map((view) => (
                    <button
                      key={view.key}
                      type="button"
                      onClick={() => showView(view.key)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition',
                        activeView === view.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <view.icon className="h-3.5 w-3.5" />
                      {view.label}
                    </button>
                  ))}
                </div>
                {dirty && <span className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>}
              </div>

              {activeView === 'code' ? (
                <Editor
                  height="100%"
                  defaultLanguage="html"
                  theme="vs-dark"
                  className="min-h-[480px] font-mono text-xs leading-5"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                  }}
                  value={html}
                  onChange={(event) => setHtml(event.target.value)}
                />
              ) : (
                <div>
                  <div className="overflow-hidden rounded-lg border border-border/70">
                    <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-muted/50 px-4 py-2">
                      <p className="truncate text-sm">
                        <span className="text-muted-foreground">Subject: </span>
                        <span className="font-medium">{previewSubject || '—'}</span>
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={RotateCcw}
                        iconPlacement="left"
                        loading={previewLoading}
                        onClick={refreshPreview}
                        disabled={previewLoading}
                      >
                        Refresh
                      </Button>
                    </div>
                    {/* Sandboxed: the preview runs rendered template HTML, never scripts. */}
                    <iframe title="Email preview" srcDoc={previewHtml} sandbox="" className="h-[560px] w-full bg-white" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Rendered with sample data through the same pipeline used for real sends.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
