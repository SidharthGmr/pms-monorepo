-- Removes the product-attribute feature (the "attribute" table and product.attributeId).
-- The separate MasterAttribute/MasterEntry models (Variant Options / Option Values) are unaffected.
-- Dropping the table also drops its partial index attribute_storeCode_name_live_key.

-- DropForeignKey
ALTER TABLE "attribute" DROP CONSTRAINT "attribute_storeCode_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_storeCode_attributeId_fkey";

-- AlterTable
ALTER TABLE "product" DROP COLUMN "attributeId";

-- DropTable
DROP TABLE "attribute";

