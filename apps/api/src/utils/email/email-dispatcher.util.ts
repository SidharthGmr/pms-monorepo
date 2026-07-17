import { sendEmail } from "../nodemailer";
import { renderTemplate } from "../templateRenderer";


interface SendEmailOptions {
  userId?: string;
  to: string;
  subject: string;
  html?: string;
  templateName?: string;
  templateData?: Record<string, any>;
}

export const dispatchEmail = async ({ userId, to, subject, html, templateName, templateData }: SendEmailOptions): Promise<any> => {
  try {
    let finalHtml = html;

    if (!finalHtml && templateName) {
      finalHtml = await renderTemplate(templateName, templateData || {});
    }
    if (!finalHtml) {
      throw new Error("Email HTML content is missing");
    }
    const emailResponse = await sendEmail(to, subject, finalHtml);

    return emailResponse;
  } catch (error) {
    console.error("EMAIL DISPATCH FAILED:", error);
    return null;
  }
};