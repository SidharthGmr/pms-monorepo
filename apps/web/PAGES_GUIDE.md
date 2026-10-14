# Dynamic Pages — admin guide

Create and publish website pages (About, Landing pages, policies, campaign pages…) from
**Admin → Pages**, with no code change and no deploy. A published page is live at
`https://<your-site>/<page-url>`.

## Creating a page

**Admin → Pages → Add page**. The editor has six tabs; only **Page name** is required, so you
can save a draft at any point and come back.

### 1. Basic Details

| Field | What it does |
|---|---|
| Page name | The page's name in the admin, and the default source of its URL. |
| URL option | **Use default** derives the URL from the name (and keeps following it when you rename). **Custom URL** lets you type it and then never changes on its own. |
| Page URL | The address after your domain, e.g. `our-story` → `/our-story`. |
| Page status | Draft / Published / Unpublished / Archived. **Only Published pages are reachable by visitors**; the other three return "page not found". |
| Include header / footer | Turn either off for a standalone layout, e.g. a campaign landing page. |
| Thumbnail image | Upload a new image or pick one from the media library. Used as the social-share image when no Open Graph image is set. |

URLs already used by the site (`products`, `contact-us`, `login`, `admin`, …) are rejected —
the real page would always win, so the editor stops you from creating one that can't be reached.
Duplicate URLs are rejected too; on **Use default**, a clashing name just gets a `-2` suffix.

### 2. Page Content

- **Visual editor** for normal editing, **HTML source** to work in raw markup — the same content,
  two views.
- **Page CSS** renders as a `<style>` tag in the head; **Page JavaScript** as a `<script>` at the
  end of the body.
- **Import full HTML** takes a complete HTML document (paste it or upload an `.html` file) and
  sorts it into the right places: `<title>` and the meta tags into **SEO Settings**, `<style>`
  into Page CSS, head scripts into **Scripts**, JSON-LD into **Schema Markup**, and the `<body>`
  into the content editor. Check each tab afterwards.
- **Preview** (top right, available on every tab) renders the page exactly as it will appear,
  without publishing it.

### 3. SEO Settings

Meta title and description show a live character count against the usual guidance (about 60 and
160). These are **recommendations** — the counter turns amber past them, nothing blocks saving.

Canonical URL, meta keywords, the robots directive, and the Open Graph title/description/image
for social sharing all live here. Open Graph falls back to the meta title/description and the
thumbnail when left empty.

### 4. Schema Markup

Add one or more JSON-LD objects (`Organization`, `FAQPage`, an `@graph` structure…). Each entry
is checked as you type and shows a green "valid" or the exact JSON error, and the panel at the
bottom shows the `<script type="application/ld+json">` that will be written into the page head.
A page with invalid JSON cannot be saved.

### 5. Scripts

Four slots, each rendered in a different place. Paste complete tags, e.g.
`<script>…</script>` or `<link rel="preload" …>`.

| Slot | Where it renders |
|---|---|
| Header script | Inside `<head>` — analytics, tag managers, verification tags. |
| After body tag script | Immediately after the opening `<body>` tag. |
| Footer script | Just before the closing `</body>` tag. |
| Preload script | Resource hints (`preload`, `preconnect`, `dns-prefetch`) in `<head>`. |

Each script is rendered exactly once. Anything here runs on the live page for every visitor, so
only paste snippets you trust.

### 6. Advanced

- **Make it password protected** — visitors must enter the password before the page opens. The
  password is stored hashed and is never shown again, so leaving the field blank on a later edit
  keeps the current one; **Remove password** clears it. Access is checked on the server, so the
  content never reaches the browser without the right password, and repeated wrong guesses are
  rate limited.
- **Page condition** — the page opens only after the visitor submits the form you choose (the
  contact form or the newsletter subscribe). This is verified server-side with a signed token
  that lasts 12 hours, not a URL flag, so it cannot be faked by editing the address.
- **Hide from search engines** — adds `noindex, nofollow` and removes the page from
  `sitemap.xml`, overriding the robots setting on the SEO tab. The page still works for anyone
  with the link.
- **Disable Google reCAPTCHA JS** — skips loading the reCAPTCHA script on this page. Forms that
  require reCAPTCHA still validate.
- **Exclude from sitemap.xml** / **XML sitemap priority** (0.0–1.0, default 0.5) — priority is
  optional metadata for crawlers, not a ranking guarantee.

## Publishing

The buttons at the top right apply to the whole page:

- **Save draft** (new pages) / **Save changes** (existing) — saves without changing visibility.
- **Publish** — sets the status to Published and saves. The page is live immediately.
- **Unpublish** — takes a live page down while keeping it and its content.
- **Preview** — opens the rendered page in a dialog without saving.

If a field fails validation the editor jumps to the tab holding it and highlights it.

## Sitemap

`https://<your-site>/sitemap.xml` is generated automatically: the fixed site pages plus every
published page, using each page's priority and last-updated date. Pages that are draft,
hidden from search, excluded from the sitemap, password protected, or form gated are left out.
It refreshes hourly.

## Notes

- Deleting a page is permanent and its URL stops working right away. To take a page down but
  keep it, use **Unpublish** or **Archived**.
- Pages belong to the store you are signed in to.
