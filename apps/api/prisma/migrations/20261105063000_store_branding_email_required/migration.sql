-- Branding moves from the Setting key/value table onto the store itself.
ALTER TABLE "store" ADD COLUMN "siteName" TEXT;
ALTER TABLE "store" ADD COLUMN "storeLogo" TEXT;

-- Carry the previously global branding (Setting rows) onto every store, so nothing
-- that was configured is lost when the Branding tab goes away.
UPDATE "store" s
SET "siteName" = COALESCE(s."siteName", (SELECT value FROM "Setting" WHERE key = 'siteName' AND value <> '')),
    "storeLogo" = COALESCE(s."storeLogo", (SELECT value FROM "Setting" WHERE key = 'logoUrl' AND value <> ''));

-- email becomes required: backfill the one global support address (or a placeholder)
-- into stores that have none, then tighten the column.
UPDATE "store"
SET "email" = COALESCE(NULLIF((SELECT value FROM "Setting" WHERE key = 'supportEmail'), ''), 'support@example.com')
WHERE "email" IS NULL OR "email" = '';

ALTER TABLE "store" ALTER COLUMN "email" SET NOT NULL;

-- The branding keys no longer exist as settings; only invoiceTemplate remains.
DELETE FROM "Setting" WHERE key IN ('logoUrl', 'siteName', 'supportEmail');
