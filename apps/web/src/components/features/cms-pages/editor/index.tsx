'use client';
import ImagePicker from '@/components/common/admin-media/image-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useCreateCmsPage, useGetCmsPageById, useUpdateCmsPage } from '@/hooks/service-hooks/useCmsPageService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { CmsPageDto, cmsPageFields, CreateCmsPageModel, PageStatus, PageStatusEnum } from '@pms/types';
import { ArrowLeft, Eye, EyeOff, FileCode2, Globe, Loader2, Undo2, Upload } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FieldErrors, useForm, UseFormReturn } from 'react-hook-form';
import HtmlImportDialog, { ImportedHtml } from './html-import-dialog';
import PreviewDialog from './preview-dialog';
import SchemaMarkupEditor, { parseSchemaEntry, SchemaEntry } from './schema-markup-editor';

// CKEditor touches window at import time, so it only ever loads in the browser.
const CustomEditor = dynamic(() => import('@/components/wyswygeditor'), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
});

const DEFAULT_VALUES: CreateCmsPageModel = {
  name: '',
  slug: '',
  urlOption: 'default',
  status: PageStatusEnum.Draft,
  includeHeader: true,
  includeFooter: true,
  thumbnailUrl: '',
  passwordEnabled: false,
  password: '',
  conditionEnabled: false,
  conditionForm: null,
  htmlContent: '',
  cssContent: '',
  jsContent: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  canonicalUrl: '',
  robots: '',
  ogTitle: '',
  ogDescription: '',
  ogImageUrl: '',
  headerScript: '',
  afterBodyScript: '',
  footerScript: '',
  preloadScript: '',
  hideFromSearch: false,
  disableRecaptcha: false,
  excludeFromSitemap: false,
  sitemapPriority: 0.5,
};

/** Which tab each field lives on, so a validation error can pull that tab into view. */
const FIELD_TABS: Record<string, string> = {
  name: 'basic',
  slug: 'basic',
  urlOption: 'basic',
  status: 'basic',
  includeHeader: 'basic',
  includeFooter: 'basic',
  thumbnailUrl: 'basic',
  htmlContent: 'content',
  cssContent: 'content',
  jsContent: 'content',
  metaTitle: 'seo',
  metaDescription: 'seo',
  metaKeywords: 'seo',
  canonicalUrl: 'seo',
  robots: 'seo',
  ogTitle: 'seo',
  ogDescription: 'seo',
  ogImageUrl: 'seo',
  schemaMarkup: 'schema',
  headerScript: 'scripts',
  afterBodyScript: 'scripts',
  footerScript: 'scripts',
  preloadScript: 'scripts',
  passwordEnabled: 'advanced',
  password: 'advanced',
  conditionEnabled: 'advanced',
  conditionForm: 'advanced',
  hideFromSearch: 'advanced',
  disableRecaptcha: 'advanced',
  excludeFromSitemap: 'advanced',
  sitemapPriority: 'advanced',
};

const ROBOTS_OPTIONS = ['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow'];

const clientSlugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const dtoToValues = (dto: CmsPageDto): CreateCmsPageModel => ({
  name: dto.name,
  slug: dto.slug,
  urlOption: dto.urlOption,
  status: dto.status,
  includeHeader: dto.includeHeader,
  includeFooter: dto.includeFooter,
  thumbnailUrl: dto.thumbnailUrl ?? '',
  passwordEnabled: dto.passwordEnabled,
  password: '',
  conditionEnabled: dto.conditionEnabled,
  conditionForm: dto.conditionForm,
  htmlContent: dto.htmlContent,
  cssContent: dto.cssContent ?? '',
  jsContent: dto.jsContent ?? '',
  metaTitle: dto.metaTitle ?? '',
  metaDescription: dto.metaDescription ?? '',
  metaKeywords: dto.metaKeywords ?? '',
  canonicalUrl: dto.canonicalUrl ?? '',
  robots: dto.robots ?? '',
  ogTitle: dto.ogTitle ?? '',
  ogDescription: dto.ogDescription ?? '',
  ogImageUrl: dto.ogImageUrl ?? '',
  headerScript: dto.headerScript ?? '',
  afterBodyScript: dto.afterBodyScript ?? '',
  footerScript: dto.footerScript ?? '',
  preloadScript: dto.preloadScript ?? '',
  hideFromSearch: dto.hideFromSearch,
  disableRecaptcha: dto.disableRecaptcha,
  excludeFromSitemap: dto.excludeFromSitemap,
  sitemapPriority: dto.sitemapPriority,
});

interface CmsPageEditorProps {
  id: number;
}

export default function CmsPageEditor({ id }: CmsPageEditorProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const router = useRouter();
  const isEdit = id > 0;

  const pageQuery = useGetCmsPageById(id, isEdit);
  const createMutation = useCreateCmsPage();
  const updateMutation = useUpdateCmsPage();

  const [tab, setTab] = useState('basic');
  const [schemaEntries, setSchemaEntries] = useState<SchemaEntry[]>([]);
  const [schemaDirty, setSchemaDirty] = useState(false);
  const [contentMode, setContentMode] = useState<'visual' | 'source'>('visual');
  // Remounts CKEditor whenever the content is replaced from outside (load, import).
  const [editorKey, setEditorKey] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [removePasswordFlag, setRemovePasswordFlag] = useState(false);

  const form = useForm<CreateCmsPageModel>({
    resolver: zodResolver(cmsPageFields),
    defaultValues: DEFAULT_VALUES,
  });

  const page = pageQuery.data?.data?.data;
  useEffect(() => {
    if (!page) return;
    form.reset(dtoToValues(page));
    setSchemaEntries((page.schemaMarkup ?? []).map((value) => ({ text: JSON.stringify(value, null, 2), error: null })));
    setSchemaDirty(false);
    setRemovePasswordFlag(false);
    setEditorKey((key) => key + 1);
  }, [page, form]);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  useUnsavedChangesWarning((form.formState.isDirty || schemaDirty) && !isSaving);

  const status = form.watch('status');
  const name = form.watch('name');
  const urlOption = form.watch('urlOption');
  const slugValue = form.watch('slug');
  const slugPreview =
    urlOption === 'custom' ? slugValue || '…' : isEdit && page && page.name === name ? page.slug : clientSlugify(name || '') || '…';

  const onInvalid = (errors: FieldErrors<CreateCmsPageModel>) => {
    const firstField = Object.keys(errors)[0];
    if (firstField && FIELD_TABS[firstField]) setTab(FIELD_TABS[firstField]);
    toast({ variant: 'destructive', title: 'Fix the highlighted fields before saving' });
  };

  const saveWith = (statusOverride?: PageStatus) =>
    form.handleSubmit(async (values) => {
      if (schemaEntries.some((entry) => parseSchemaEntry(entry.text).error)) {
        setTab('schema');
        toast({ variant: 'destructive', title: 'Fix the invalid schema markup before saving' });
        return;
      }
      const schemaObjects = schemaEntries
        .map((entry) => parseSchemaEntry(entry.text).value)
        .filter((value): value is Record<string, unknown> => !!value);

      const model: CreateCmsPageModel = {
        ...values,
        status: statusOverride ?? values.status,
        schemaMarkup: schemaObjects.length > 0 ? schemaObjects : null,
        removePassword: removePasswordFlag,
      };
      if (!model.password) delete model.password;

      const response = isEdit ? await updateMutation.mutateAsync({ id, model }) : await createMutation.mutateAsync(model);
      if (response && (response.status === 200 || response.status === 201) && response.data.data) {
        const saved = response.data.data;
        toast({ variant: 'success', title: `"${saved.name}" ${isEdit ? 'saved' : 'created'}`, description: <span>Status: {saved.status}</span> });
        form.reset(dtoToValues(saved));
        setSchemaDirty(false);
        setRemovePasswordFlag(false);
        if (!isEdit) router.replace(`/admin/pages/${saved.id}?edit=1`);
      } else {
        const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
        toast({ variant: 'destructive', title: 'Could not save the page', description: <span>{error}</span> });
      }
    }, onInvalid)();

  const applyImport = (imported: ImportedHtml) => {
    const setText = (field: keyof CreateCmsPageModel, value: string | null) => {
      if (value) form.setValue(field, value, { shouldDirty: true });
    };
    if (!form.getValues('name') && imported.title) setText('name', imported.title);
    setText('metaTitle', imported.title);
    setText('metaDescription', imported.metaDescription);
    setText('metaKeywords', imported.metaKeywords);
    setText('canonicalUrl', imported.canonicalUrl);
    setText('robots', imported.robots);
    setText('ogTitle', imported.ogTitle);
    setText('ogDescription', imported.ogDescription);
    setText('ogImageUrl', imported.ogImageUrl);
    setText('cssContent', imported.css);
    setText('headerScript', imported.headerScripts);
    setText('preloadScript', imported.preloadLinks);
    form.setValue('htmlContent', imported.bodyHtml, { shouldDirty: true });
    if (imported.schemaJson.length > 0) {
      setSchemaEntries(
        imported.schemaJson.map((text) => {
          const { value, error } = parseSchemaEntry(text);
          return { text: value ? JSON.stringify(value, null, 2) : text, error };
        })
      );
      setSchemaDirty(true);
    }
    setContentMode('source');
    setEditorKey((key) => key + 1);
    toast({ variant: 'success', title: 'HTML imported', description: <span>Check each tab - the document was split into the matching fields.</span> });
  };

  const previewValues = form.watch();
  const previewSchemaObjects = useMemo(
    () => schemaEntries.map((entry) => parseSchemaEntry(entry.text).value).filter((value): value is Record<string, unknown> => !!value),
    [schemaEntries]
  );

  if (isEdit && pageQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-9 w-full max-w-xl" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isEdit && (pageQuery.isError || (!pageQuery.isPending && !page))) {
    return (
      <Card className="py-16 text-center">
        <p className="text-sm font-semibold text-destructive">Could not load this page</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/admin/pages">Back to pages</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button asChild type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Back to pages">
              <Link href="/admin/pages">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight">{isEdit ? page?.name : 'Add page'}</h1>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />/{slugPreview}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="h-9 gap-1.5" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            {isEdit && (
              <Button type="button" variant="outline" className="h-9" disabled={isSaving} onClick={() => saveWith()}>
                {isSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            )}
            {!isEdit && (
              <Button type="button" variant="outline" className="h-9" disabled={isSaving} onClick={() => saveWith(PageStatusEnum.Draft)}>
                {isSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Save draft
              </Button>
            )}
            {status === PageStatusEnum.Published ? (
              <Button type="button" variant="secondary" className="h-9" disabled={isSaving} onClick={() => saveWith(PageStatusEnum.Unpublished)}>
                Unpublish
              </Button>
            ) : (
              <Button type="button" className="h-9" disabled={isSaving} onClick={() => saveWith(PageStatusEnum.Published)}>
                Publish
              </Button>
            )}
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-auto w-full flex-wrap justify-start">
            <TabsTrigger value="basic">Basic Details</TabsTrigger>
            <TabsTrigger value="content">Page Content</TabsTrigger>
            <TabsTrigger value="seo">SEO Settings</TabsTrigger>
            <TabsTrigger value="schema">Schema Markup</TabsTrigger>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* ------------------------------------------------ Basic Details */}
          <TabsContent value="basic">
            <Card className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="max-w-xl">
                    <FormLabel>Page name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Our Story" autoFocus={!isEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid max-w-xl gap-4 sm:grid-cols-[180px_1fr]">
                <FormField
                  control={form.control}
                  name="urlOption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL option</FormLabel>
                      <Select value={field.value ?? 'default'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="default">Use default</SelectItem>
                          <SelectItem value="custom">Custom URL</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page URL {urlOption === 'custom' && '*'}</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">/</span>
                          <Input
                            {...field}
                            value={urlOption === 'custom' ? (field.value ?? '') : slugPreview === '…' ? '' : slugPreview}
                            disabled={urlOption !== 'custom'}
                            placeholder={urlOption === 'custom' ? 'our-story' : 'generated from the page name'}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="max-w-[240px]">
                    <FormLabel>Page status</FormLabel>
                    <Select value={field.value ?? PageStatusEnum.Draft} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PageStatusEnum.Draft}>Draft</SelectItem>
                        <SelectItem value={PageStatusEnum.Published}>Published</SelectItem>
                        <SelectItem value={PageStatusEnum.Unpublished}>Unpublished</SelectItem>
                        <SelectItem value={PageStatusEnum.Archived}>Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Only Published pages are reachable by visitors.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap gap-8">
                <SwitchField form={form} name="includeHeader" label="Include header" hint="Show the site header on this page" />
                <SwitchField form={form} name="includeFooter" label="Include footer" hint="Show the site footer on this page" />
              </div>

              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail image</FormLabel>
                    <FormControl>
                      <ImagePicker value={field.value} onChange={(url) => field.onChange(url ?? '')} label="thumbnail" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>
          </TabsContent>

          {/* ------------------------------------------------ Page Content */}
          <TabsContent value="content">
            <Card className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 rounded-lg border p-0.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={contentMode === 'visual' ? 'secondary' : 'ghost'}
                    className="h-7 px-2.5 text-xs"
                    onClick={() => {
                      setContentMode('visual');
                      setEditorKey((key) => key + 1);
                    }}
                  >
                    Visual editor
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={contentMode === 'source' ? 'secondary' : 'ghost'}
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setContentMode('source')}
                  >
                    HTML source
                  </Button>
                </div>
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setShowImport(true)}>
                  <Upload className="h-3.5 w-3.5" />
                  Import full HTML
                </Button>
              </div>

              <FormField
                control={form.control}
                name="htmlContent"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      {contentMode === 'visual' ? (
                        <div className="rounded-lg border [&_.ck-editor__editable]:min-h-64">
                          <CustomEditor
                            key={editorKey}
                            data={field.value ?? ''}
                            onChange={(_event: unknown, editor: { getData: () => string }) => form.setValue('htmlContent', editor.getData(), { shouldDirty: true })}
                          />
                        </div>
                      ) : (
                        <Textarea
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          rows={18}
                          spellCheck={false}
                          placeholder="<section>…</section>"
                          className="font-mono text-xs"
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ScriptField form={form} name="cssContent" label="Page CSS" hint="Rendered as a <style> tag in the page head." rows={8} placeholder=".hero { … }" />
              <ScriptField form={form} name="jsContent" label="Page JavaScript" hint="Rendered as a <script> tag at the end of the page body." rows={8} placeholder="document.querySelector(…)" />
            </Card>
          </TabsContent>

          {/* ------------------------------------------------ SEO Settings */}
          <TabsContent value="seo">
            <Card className="space-y-5">
              <CountedField form={form} name="metaTitle" label="Meta title" recommended={60} placeholder="Shown as the tab title and in search results" />
              <CountedField
                form={form}
                name="metaDescription"
                label="Meta description"
                recommended={160}
                textarea
                placeholder="A short pitch for this page in search results"
              />
              <FormField
                control={form.control}
                name="metaKeywords"
                render={({ field }) => (
                  <FormItem className="max-w-2xl">
                    <FormLabel>Meta keywords</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} placeholder="comma, separated, keywords" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="canonicalUrl"
                render={({ field }) => (
                  <FormItem className="max-w-2xl">
                    <FormLabel>Canonical URL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} placeholder="https://example.com/preferred-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="robots"
                render={({ field }) => (
                  <FormItem className="max-w-[240px]">
                    <FormLabel>Robots meta</FormLabel>
                    <Select value={field.value || 'index,follow'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROBOTS_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Overridden by &quot;Hide from search engines&quot; under Advanced.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-5 rounded-lg border p-4">
                <p className="text-sm font-semibold">Social sharing (Open Graph)</p>
                <CountedField form={form} name="ogTitle" label="Open Graph title" recommended={60} placeholder="Defaults to the meta title when empty" />
                <CountedField
                  form={form}
                  name="ogDescription"
                  label="Open Graph description"
                  recommended={160}
                  textarea
                  placeholder="Defaults to the meta description when empty"
                />
                <FormField
                  control={form.control}
                  name="ogImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open Graph image</FormLabel>
                      <FormControl>
                        <ImagePicker value={field.value} onChange={(url) => field.onChange(url ?? '')} label="social image" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          </TabsContent>

          {/* ------------------------------------------------ Schema Markup */}
          <TabsContent value="schema">
            <Card className="space-y-4">
              <div>
                <p className="text-sm font-semibold">JSON-LD structured data</p>
                <p className="text-xs text-muted-foreground">
                  Each entry is one JSON-LD object (plain or @graph). Valid entries render inside a single script tag in the page head.
                </p>
              </div>
              <SchemaMarkupEditor
                entries={schemaEntries}
                onChange={(entries) => {
                  setSchemaEntries(entries);
                  setSchemaDirty(true);
                }}
              />
            </Card>
          </TabsContent>

          {/* ------------------------------------------------ Scripts */}
          <TabsContent value="scripts">
            <Card className="space-y-5">
              <ScriptField form={form} name="headerScript" label="Header script" hint="Full tags, e.g. <script>…</script> - rendered inside <head>." rows={6} placeholder='<script async src="https://www.googletagmanager.com/…"></script>' />
              <ScriptField form={form} name="afterBodyScript" label="After body tag script" hint="Rendered immediately after the opening <body> tag." rows={6} placeholder="<noscript>…</noscript>" />
              <ScriptField form={form} name="footerScript" label="Footer script" hint="Rendered just before the closing </body> tag." rows={6} placeholder="<script>…</script>" />
              <ScriptField form={form} name="preloadScript" label="Preload script" hint='Resource hints, e.g. <link rel="preload" …> - rendered in <head>.' rows={5} placeholder='<link rel="preload" href="/fonts/Inter.woff2" as="font" crossorigin>' />
            </Card>
          </TabsContent>

          {/* ------------------------------------------------ Advanced */}
          <TabsContent value="advanced">
            <Card className="space-y-6">
              <div className="space-y-4 rounded-lg border p-4">
                <SwitchField form={form} name="passwordEnabled" label="Make it password protected" hint="Visitors must enter this password before the page opens" />
                {form.watch('passwordEnabled') && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="max-w-sm">
                        <FormLabel>Page password {!page?.hasPassword && '*'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              placeholder={page?.hasPassword ? 'Leave blank to keep the current password' : 'At least 4 characters'}
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowPassword((value) => !value)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {page?.hasPassword &&
                  (removePasswordFlag ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>The password will be removed when you save.</span>
                      <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => setRemovePasswordFlag(false)}>
                        <Undo2 className="h-3 w-3" />
                        Undo
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setRemovePasswordFlag(true);
                        form.setValue('passwordEnabled', false, { shouldDirty: true });
                        form.setValue('password', '', { shouldDirty: true });
                      }}
                    >
                      Remove password
                    </Button>
                  ))}
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <SwitchField
                  form={form}
                  name="conditionEnabled"
                  label="Page condition"
                  hint="Visitors can open this page only after submitting the chosen form"
                />
                {form.watch('conditionEnabled') && (
                  <FormField
                    control={form.control}
                    name="conditionForm"
                    render={({ field }) => (
                      <FormItem className="max-w-[260px]">
                        <FormLabel>Required form *</FormLabel>
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a form" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="contact">Contact form (/contact-us)</SelectItem>
                            <SelectItem value="subscribe">Newsletter subscribe</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Access is verified server-side with a signed token, not a URL flag.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <SwitchField
                  form={form}
                  name="hideFromSearch"
                  label="Hide from search engines"
                  hint="Adds noindex,nofollow and drops the page from sitemap.xml"
                />
                <SwitchField
                  form={form}
                  name="disableRecaptcha"
                  label="Disable Google reCAPTCHA JS"
                  hint="Skips loading the reCAPTCHA script on this page (forms that need it still validate)"
                />
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <SwitchField form={form} name="excludeFromSitemap" label="Exclude from sitemap.xml" hint="Keep the page out of the generated sitemap" />
                <FormField
                  control={form.control}
                  name="sitemapPriority"
                  render={({ field }) => (
                    <FormItem className="max-w-[180px]">
                      <FormLabel>XML sitemap priority</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.1}
                          value={field.value ?? 0.5}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">0.0 to 1.0 - optional metadata for crawlers, not a ranking guarantee.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </form>

      {showPreview && <PreviewDialog isOpen={showPreview} onClose={() => setShowPreview(false)} values={previewValues} schemaObjects={previewSchemaObjects} />}
      {showImport && <HtmlImportDialog isOpen={showImport} onClose={() => setShowImport(false)} onImport={applyImport} />}
    </Form>
  );
}

interface SwitchFieldProps {
  form: UseFormReturn<CreateCmsPageModel>;
  name: 'includeHeader' | 'includeFooter' | 'passwordEnabled' | 'conditionEnabled' | 'hideFromSearch' | 'disableRecaptcha' | 'excludeFromSitemap';
  label: string;
  hint: string;
}

function SwitchField({ form, name, label, hint }: SwitchFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-3 space-y-0">
          <FormControl>
            <Switch checked={!!field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <div>
            <FormLabel className="cursor-pointer text-sm font-medium">{label}</FormLabel>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </FormItem>
      )}
    />
  );
}

interface ScriptFieldProps {
  form: UseFormReturn<CreateCmsPageModel>;
  name: 'cssContent' | 'jsContent' | 'headerScript' | 'afterBodyScript' | 'footerScript' | 'preloadScript';
  label: string;
  hint: string;
  rows: number;
  placeholder?: string;
}

function ScriptField({ form, name, label, hint, rows, placeholder }: ScriptFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-1.5">
            <FileCode2 className="h-3.5 w-3.5 text-muted-foreground" />
            {label}
          </FormLabel>
          <FormControl>
            <Textarea value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} rows={rows} spellCheck={false} placeholder={placeholder} className="font-mono text-xs" />
          </FormControl>
          <p className="text-xs text-muted-foreground">{hint}</p>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface CountedFieldProps {
  form: UseFormReturn<CreateCmsPageModel>;
  name: 'metaTitle' | 'metaDescription' | 'ogTitle' | 'ogDescription';
  label: string;
  /** Soft guidance only - the counter turns amber past it, nothing blocks saving. */
  recommended: number;
  textarea?: boolean;
  placeholder?: string;
}

function CountedField({ form, name, label, recommended, textarea, placeholder }: CountedFieldProps) {
  const length = (form.watch(name) ?? '').length;
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="max-w-2xl">
          <div className="flex items-center justify-between">
            <FormLabel>{label}</FormLabel>
            <span className={cn('text-[11px] tabular-nums text-muted-foreground', length > recommended && 'text-amber-600')}>
              {length}/{recommended} recommended
            </span>
          </div>
          <FormControl>
            {textarea ? (
              <Textarea value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} rows={3} placeholder={placeholder} />
            ) : (
              <Input {...field} value={field.value ?? ''} placeholder={placeholder} />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
