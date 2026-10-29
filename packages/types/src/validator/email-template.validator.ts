import { z } from "zod";

/**
 * Flat field schema, shared by the web editor form and the API.
 * The subject and body both carry {{placeholder}} tokens, so neither is HTML-escaped here;
 * the API renders them through the same template pipeline as the file defaults.
 */
export const emailTemplateFields = z.object({
  subject: z.string().trim().min(1, "A subject is required").max(200, "Subject must be 200 characters or fewer"),
  html: z.string().min(1, "The template body is required").max(100000, "Template body must be 100,000 characters or fewer"),
});

export const updateEmailTemplateValidator = z.object({
  body: emailTemplateFields,
});

/** Preview and test-send take the editor's current (possibly unsaved) subject and body. */
export const previewEmailTemplateValidator = z.object({
  body: emailTemplateFields,
});
