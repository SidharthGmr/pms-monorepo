import { z } from "zod";
import { ContactMessageStatusEnum } from "../enum/contact-message-status.enum";

/**
 * Flat field schema, shared by the web form and the API.
 *
 * Forms get this one: react-hook-form hands the resolver flat values, so a `body`
 * wrapped schema can never match and the form silently refuses to submit.
 * The API gets the wrapped exports below, because `validate()` parses
 * `{ body, query, params }`. Same rules either way - one source of truth.
 */
export const contactMessageFields = z.object({
  name: z.string().trim().min(1, "Your name is required").max(100, "Name must be 100 characters or fewer"),
  email: z.string().trim().min(1, "Your email is required").email("Enter a valid email address").max(254, "Email must be 254 characters or fewer"),
  phone: z
    .preprocess((v) => (v === "" || v == null ? null : v), z.string().trim().max(20, "Phone must be 20 characters or fewer").nullable())
    .optional(),
  subject: z.string().trim().min(1, "A subject is required").max(150, "Subject must be 150 characters or fewer"),
  message: z.string().trim().min(10, "Tell us a little more - at least 10 characters").max(4000, "Message must be 4000 characters or fewer"),
});

export const ContactMessageValidator = z.object({
  body: contactMessageFields,
});

/** The admin moves a message between NEW, READ and RESOLVED; nothing else is writable. */
export const updateContactMessageStatusValidator = z.object({
  body: z.object({
    status: z.nativeEnum(ContactMessageStatusEnum),
  }),
});
