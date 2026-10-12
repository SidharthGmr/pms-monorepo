import { z } from "zod";

/** Flat for the newsletter form, wrapped below for the API's validate() middleware. */
export const subscriberFields = z.object({
  email: z.string().trim().min(1, "Your email is required").email("Enter a valid email address").max(254, "Email must be 254 characters or fewer"),
});

export const SubscriberValidator = z.object({
  body: subscriberFields,
});
