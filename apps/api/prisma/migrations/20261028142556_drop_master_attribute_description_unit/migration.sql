-- Removes the unused `description` and `unit` columns from MasterAttribute.
-- Both were nullable and held no data in any row at the time of this migration.
ALTER TABLE "MasterAttribute" DROP COLUMN "description",
DROP COLUMN "unit";
