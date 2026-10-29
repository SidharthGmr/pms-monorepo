import env from "../../config/env";
import prisma from "../../config/prisma";
import { sendEmail } from "../brevo.mailer";
import { fillPlaceholders, renderTemplate, renderTemplateContent } from "../templateRenderer";

// Every templated email carries the brand: logo, name, site link and year, in both
// placeholder casings the templates use. Shared with the admin editor's preview so
// what the editor shows is what the dispatcher sends. The admin's uploaded logo and site
// name win over the bundled defaults; a settings-table miss must never block a send, so a
// failed lookup silently falls back.
export const emailBrandDefaults = async (): Promise<Record<string, string>> => {
  const siteUrl = (env.APP_PUBLIC_URL || "").replace(/\/$/, "");
  const year = String(new Date().getFullYear());

  const rows = await prisma.setting.findMany({ where: { key: { in: ["logoUrl", "siteName"] } } }).catch(() => []);
  const stored = new Map(rows.map((row) => [row.key, row.value]));

  const appName = stored.get("siteName") || env.APP_NAME;
  // An email client fetches with no session and no page context, so the logo must be absolute.
  const storedLogo = stored.get("logoUrl");
  const logoUrl = storedLogo ? (/^https?:\/\//i.test(storedLogo) ? storedLogo : `${siteUrl}${storedLogo.startsWith("/") ? "" : "/"}${storedLogo}`) : `${siteUrl}/logo-full-light.png`;

  return {
    appName,
    PlatformName: appName,
    siteUrl,
    WebsiteUrl: siteUrl,
    logoUrl,
    year,
    Year: year,
  };
};

interface SendEmailOptions {
  userId?: string;
  to: string;
  subject: string;
  html?: string;
  templateName?: string;
  templateData?: Record<string, any>;
}

// Sends via Brevo's SMTP relay (see ../nodemailer). Returns null on failure so callers
// (e.g. auth flows) are never blocked by a mail error — check server logs for details.
export const dispatchEmailAsync = async ({ userId, to, subject, html, templateName, templateData }: SendEmailOptions): Promise<any> => {
  try {
    let finalHtml = html;
    let finalSubject = subject;

    if (!finalHtml && templateName) {
      // Values the caller sends always win over the brand defaults.
      const variables = { ...(await emailBrandDefaults()), ...(templateData || {}) };

      // An admin-saved override (EmailTemplate row) replaces the file default - body and
      // subject both. A DB hiccup must never block the send, so a failed lookup falls back
      // to the file template.
      const override = await prisma.emailTemplate.findUnique({ where: { key: templateName } }).catch(() => null);
      if (override) {
        finalHtml = await renderTemplateContent(templateName, override.html, variables);
        if (override.subject) finalSubject = fillPlaceholders(override.subject, variables);
      } else {
        finalHtml = await renderTemplate(templateName, variables);
      }
    }
    if (!finalHtml) {
      throw new Error("Email HTML content is missing");
    }

    const emailResponse = await sendEmail(to, finalSubject, finalHtml);
    return emailResponse;
  } catch (error) {
    console.error("EMAIL DISPATCH FAILED:", error);
    return null;
  }
};
