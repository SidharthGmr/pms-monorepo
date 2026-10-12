import { ContactMessageDto } from "@pms/types";
import env from "../../config/env";
import logger from "../logger";
import { dispatchEmailAsync } from "./emailDispatcher.util";

// The renderer does raw {{key}} replacement, so everything a visitor typed is escaped here.
const esc = (value: string | null | undefined): string =>
  String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Tells the shop a contact-form message arrived. Recipient: ADMIN_NOTIFY_EMAIL, else the
 * ADMIN user's address the caller looked up. Never throws - a mail failure is logged and the
 * visitor's submission stands.
 */
export const notifyAdminOfContactMessage = async (message: ContactMessageDto, fallbackRecipient?: string): Promise<void> => {
  try {
    const to = env.ADMIN_NOTIFY_EMAIL || fallbackRecipient;
    if (!to) {
      logger.warn("contact notification skipped - ADMIN_NOTIFY_EMAIL is not set and no admin user has an email", { contactMessageId: message.id });
      return;
    }

    const receivedAt = new Date(message.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

    await dispatchEmailAsync({
      to,
      subject: `New contact message: ${message.subject} - ${message.name}`,
      templateName: "contact-message",
      templateData: {
        appName: env.APP_NAME,
        name: esc(message.name),
        email: esc(message.email),
        phone: esc(message.phone || "Not given"),
        subject: esc(message.subject),
        receivedAt,
        messageBody: esc(message.message).replace(/\r?\n/g, "<br/>"),
        replyTo: `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`,
        adminUrl: `${env.APP_PUBLIC_URL || ""}/admin/contact-messages/`,
      },
    });

    logger.info("contact notification sent", { contactMessageId: message.id, to });
  } catch (error) {
    logger.error("contact notification failed", { contactMessageId: message.id, error: (error as Error)?.message });
  }
};
