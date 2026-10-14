import { z } from "zod";

/**
 * Notifications are written by the server, never posted by a client, so the only thing a
 * caller sends is which of their own rows to mark as read. `validate()` parses
 * `{ body, query, params }`, hence the wrapper.
 */
export const markNotificationsReadFields = z.object({
  ids: z.array(z.number().int().positive()).max(200, "Mark at most 200 notifications at a time").optional(),
});

export const MarkNotificationsReadValidator = z.object({
  body: markNotificationsReadFields,
});
