-- Removes the supplier contactPerson and notes fields from the API and UI.
-- Both columns were empty (0 suppliers, 0 non-null values) when this was generated.

-- AlterTable
ALTER TABLE "supplier" DROP COLUMN "contactPerson",
DROP COLUMN "notes";

