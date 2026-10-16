import { z } from "zod";
import { PageStatusEnum } from "../enum/page-status.enum";

/**
 * Slugs that can never be pages: every static route, route group entry and redirect the
 * web app already owns. A page with one of these slugs would be unreachable (static routes
 * win) or would shadow an app redirect, so they are rejected at validation time.
 */
export const RESERVED_CMS_SLUGS = [
  "about-us",
  "contact-us",
  "products",
  "demo-products",
  "image",
  "login",
  "sign-up",
  "recover-password",
  "reset-password",
  "verify-email",
  "admin",
  "superadmin",
  "dashboard",
  "comingsoon",
  "access-denied",
  "api",
  "account",
  "student",
  "page-not-found",
  "app",
  "gmr",
  "sitemap.xml",
  "robots.txt",
] as const;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const emptyToNull = (v: unknown) => (v === "" || v == null ? null : v);

const nullableText = (max: number, label: string) =>
  z.preprocess(emptyToNull, z.string().trim().max(max, `${label} must be ${max} characters or fewer`).nullable()).optional();

/** Scripts are long but not unbounded - 50k covers every tracker snippet with a wide margin. */
const nullableScript = (label: string) =>
  z.preprocess(emptyToNull, z.string().max(50000, `${label} must be 50000 characters or fewer`).nullable()).optional();

/**
 * Flat field schema, shared by the admin form and the API (same split as
 * contact-message.validator.ts: forms use this, the API uses the body-wrapped exports).
 */
export const cmsPageFields = z
  .object({
    name: z.string().trim().min(1, "A page name is required").max(200, "Name must be 200 characters or fewer"),
    slug: z
      .preprocess(
        emptyToNull,
        z
          .string()
          .trim()
          .toLowerCase()
          .max(200, "Slug must be 200 characters or fewer")
          .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens, e.g. our-story")
          .refine((v) => !(RESERVED_CMS_SLUGS as readonly string[]).includes(v), "This URL is reserved by the site and cannot be used")
          .nullable()
      )
      .optional(),
    urlOption: z.enum(["default", "custom"]).optional(),
    status: z.nativeEnum(PageStatusEnum).optional(),
    includeHeader: z.boolean().optional(),
    includeFooter: z.boolean().optional(),
    thumbnailUrl: nullableText(1000, "Thumbnail URL"),
    passwordEnabled: z.boolean().optional(),
    password: z
      .preprocess(emptyToNull, z.string().min(4, "Page password must be at least 4 characters").max(100, "Page password must be 100 characters or fewer").nullable())
      .optional(),
    removePassword: z.boolean().optional(),
    conditionEnabled: z.boolean().optional(),
    conditionForm: z.preprocess(emptyToNull, z.enum(["contact", "subscribe"]).nullable()).optional(),
    // The API accepts request bodies up to JSON_BODY_LIMIT (1mb), so the HTML plus every
    // other field has to fit under it with room to spare.
    htmlContent: z.string().max(500000, "Page HTML must be 500,000 characters or fewer").optional(),
    cssContent: nullableScript("Page CSS"),
    jsContent: nullableScript("Page JavaScript"),
    metaTitle: nullableText(255, "Meta title"),
    metaDescription: nullableText(1000, "Meta description"),
    metaKeywords: nullableText(500, "Meta keywords"),
    canonicalUrl: z
      .preprocess(emptyToNull, z.string().trim().url("Canonical URL must be a full URL, e.g. https://example.com/page").max(1000).nullable())
      .optional(),
    robots: nullableText(100, "Robots directive"),
    ogTitle: nullableText(255, "Open Graph title"),
    ogDescription: nullableText(1000, "Open Graph description"),
    ogImageUrl: nullableText(1000, "Open Graph image URL"),
    schemaMarkup: z.array(z.record(z.string(), z.unknown()), { message: "Schema markup must be a list of JSON-LD objects" }).nullable().optional(),
    headerScript: nullableScript("Header script"),
    afterBodyScript: nullableScript("After-body script"),
    footerScript: nullableScript("Footer script"),
    preloadScript: nullableScript("Preload script"),
    hideFromSearch: z.boolean().optional(),
    disableRecaptcha: z.boolean().optional(),
    excludeFromSitemap: z.boolean().optional(),
    sitemapPriority: z
      .number({ message: "Sitemap priority must be a number" })
      .min(0, "Sitemap priority is between 0.0 and 1.0")
      .max(1, "Sitemap priority is between 0.0 and 1.0")
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.urlOption === "custom" && !value.slug) {
      ctx.addIssue({ code: "custom", path: ["slug"], message: "Enter the custom URL for this page" });
    }
    if (value.conditionEnabled && !value.conditionForm) {
      ctx.addIssue({ code: "custom", path: ["conditionForm"], message: "Choose which form unlocks this page" });
    }
  });

export const CmsPageValidator = z.object({
  body: cmsPageFields,
});

export const UnlockCmsPageValidator = z.object({
  body: z.object({
    password: z.string().min(1, "Enter the page password"),
  }),
});
